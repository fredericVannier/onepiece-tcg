package cards

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"onepiece-tcg-api/internal/agents"
)

type DevisItem struct {
	ExternalID string  `json:"external_id"`
	Name       string  `json:"name"`
	Rarity     string  `json:"rarity"`
	Price      float64 `json:"price"`
	Qty        int     `json:"qty"`
}

type DevisRequest struct {
	Items []DevisItem `json:"items"`
}

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}
func (h *Handler) GetCards(w http.ResponseWriter, r *http.Request) {

	queryParams := r.URL.Query()

	name := queryParams.Get("name")
	color := queryParams.Get("color")
	rarity := queryParams.Get("rarity")
	cardType := queryParams.Get("cardType")
	cardSet := queryParams.Get("cardSet")

	page, _ := strconv.Atoi(queryParams.Get("page"))
	limit, _ := strconv.Atoi(queryParams.Get("limit"))

	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}

	cards, total, err := h.service.SearchCards(
		name,
		color,
		rarity,
		cardType,
		cardSet,
		page,
		limit,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"data":  cards,
		"total": total,
		"page":  page,
		"limit": limit,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) GetSets(w http.ResponseWriter, r *http.Request) {
	sets, err := h.service.GetSets()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sets)
}

func (h *Handler) SendDevis(w http.ResponseWriter, r *http.Request) {
	var req DevisRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if len(req.Items) == 0 {
		http.Error(w, "basket is empty", http.StatusBadRequest)
		return
	}
	if err := h.service.SendDevis(req.Items); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ProxyImage(w http.ResponseWriter, r *http.Request) {
	cardNum := chi.URLParam(r, "cardNum")
	imageURL := fmt.Sprintf("https://en.onepiece-cardgame.com/images/cardlist/card/%s.png", cardNum)

	resp, err := http.Get(imageURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		http.NotFound(w, r)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	io.Copy(w, resp.Body)
}

// SearchNatural converts a free-text query to structured filters using keyword rules.
// POST /search/natural  body: {"query": "luffy rouge pas cher"}
func (h *Handler) SearchNatural(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Query string `json:"query"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Query == "" {
		http.Error(w, "body must contain {\"query\": \"...\"}", http.StatusBadRequest)
		return
	}
	filters := agents.NaturalSearch(body.Query)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filters)
}

// Recommend suggests complementary cards using set/color heuristics.
// POST /recommendations  body: {"basket": [{external_id, name, color, rarity, card_type, price}]}
func (h *Handler) Recommend(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Basket []agents.BasketItem `json:"basket"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if len(body.Basket) == 0 {
		http.Error(w, "basket is empty", http.StatusBadRequest)
		return
	}

	// Build candidate pool from same sets as basket items
	var setFilters []string
	for _, item := range body.Basket {
		if len(item.ExternalID) >= 4 {
			setFilters = append(setFilters, item.ExternalID[:4])
		}
	}
	var candidates []CardEntity
	for _, setCode := range unique(setFilters) {
		var batch []CardEntity
		h.service.repo.db.Where("external_id LIKE ?", setCode+"-%").Limit(20).Find(&batch)
		candidates = append(candidates, batch...)
	}
	if len(candidates) > 60 {
		candidates = candidates[:60]
	}

	candidateItems := make([]agents.BasketItem, len(candidates))
	for i, c := range candidates {
		candidateItems[i] = agents.BasketItem{
			ExternalID: c.ExternalID,
			Name:       c.Name,
			Color:      c.Color,
			Rarity:     c.Rarity,
			CardType:   c.CardType,
			Price:      c.Price,
		}
	}

	result := agents.Recommend(body.Basket, candidateItems)

	type enriched struct {
		agents.Recommendation
		Card *CardEntity `json:"card,omitempty"`
	}
	enrichedRecs := make([]enriched, 0, len(result.Recommendations))
	for _, rec := range result.Recommendations {
		var card CardEntity
		h.service.repo.db.Where("external_id = ?", rec.ExternalID).First(&card)
		enrichedRecs = append(enrichedRecs, enriched{rec, &card})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"recommendations": enrichedRecs,
		"reasoning":       result.Reasoning,
	})
}

// ChatDevis handles the devis assistant via SSE (rule-based responses).
// POST /devis/chat  body: {"messages": [{role, content}], "basket": [...]}
func (h *Handler) ChatDevis(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages []agents.ChatMessage     `json:"messages"`
		Basket   []agents.DevisBasketItem `json:"basket"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if len(body.Messages) == 0 {
		http.Error(w, "messages cannot be empty", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	if err := agents.ChatDevis(body.Messages, body.Basket, w); err != nil {
		fmt.Fprintf(w, "data: [ERROR] %s\n\n", err.Error())
	}
}

func unique(ss []string) []string {
	seen := map[string]bool{}
	var out []string
	for _, s := range ss {
		if !seen[s] {
			seen[s] = true
			out = append(out, s)
		}
	}
	return out
}

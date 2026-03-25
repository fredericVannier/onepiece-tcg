package cards

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
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

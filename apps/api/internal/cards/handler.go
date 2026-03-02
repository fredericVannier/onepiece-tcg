package cards

import (
	"encoding/json"
	"net/http"
	"strconv"
)

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

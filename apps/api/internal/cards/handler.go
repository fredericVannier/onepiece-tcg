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

	// pagination
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 1020
	offset := 0

	if l, err := strconv.Atoi(limitStr); err == nil {
		limit = l
	}

	if o, err := strconv.Atoi(offsetStr); err == nil {
		offset = o
	}

	cards, err := h.service.GetAllCards(limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cards)
}

package agents

import (
	"fmt"
	"strings"
)

// BasketItem represents a card in the user's basket.
type BasketItem struct {
	ExternalID string  `json:"external_id"`
	Name       string  `json:"name"`
	Color      string  `json:"color"`
	Rarity     string  `json:"rarity"`
	CardType   string  `json:"card_type"`
	Price      float64 `json:"price"`
}

// Recommendation is a suggested card with a reason.
type Recommendation struct {
	ExternalID string `json:"external_id"`
	Reason     string `json:"reason"`
}

// RecommendationResult holds suggestions and a short overall explanation.
type RecommendationResult struct {
	Recommendations []Recommendation `json:"recommendations"`
	Reasoning       string           `json:"reasoning"`
}

// Recommend suggests complementary cards based on the basket using
// set completion and color synergy heuristics (no API key required).
func Recommend(basket []BasketItem, candidates []BasketItem) RecommendationResult {
	// Build lookup of cards already in basket
	inBasket := make(map[string]bool, len(basket))
	for _, b := range basket {
		inBasket[b.ExternalID] = true
	}

	// Count color and set frequency from basket
	colorCount := map[string]int{}
	setCount := map[string]int{}
	for _, b := range basket {
		colorCount[b.Color]++
		if len(b.ExternalID) >= 4 {
			setCount[b.ExternalID[:4]]++
		}
	}
	dominantColor := topKey(colorCount)
	dominantSet := topKey(setCount)

	// Score candidates
	type scored struct {
		card   BasketItem
		score  int
		reason string
	}
	var pool []scored

	for _, c := range candidates {
		if inBasket[c.ExternalID] {
			continue
		}
		score := 0
		var reasons []string

		setCode := ""
		if len(c.ExternalID) >= 4 {
			setCode = c.ExternalID[:4]
		}

		if setCode == dominantSet {
			score += 3
			reasons = append(reasons, fmt.Sprintf("same set (%s)", dominantSet))
		}
		if c.Color == dominantColor {
			score += 2
			reasons = append(reasons, fmt.Sprintf("same color (%s)", dominantColor))
		}
		// Bonus for complementary rarities: if basket has SR/R, suggest UC/C for budget balance
		if hasHighRarity(basket) && (c.Rarity == "UC" || c.Rarity == "C") {
			score++
			reasons = append(reasons, "budget complement")
		}
		// Bonus for characters if basket has leaders
		if hasLeader(basket) && c.CardType == "Character" {
			score++
			reasons = append(reasons, "pairs with leader")
		}

		if score > 0 {
			reason := "Complements your basket"
			if len(reasons) > 0 {
				reason = strings.Join(reasons, ", ")
				reason = strings.ToUpper(reason[:1]) + reason[1:]
			}
			pool = append(pool, scored{c, score, reason})
		}
	}

	// Sort by score descending (simple insertion sort — small pool)
	for i := 1; i < len(pool); i++ {
		for j := i; j > 0 && pool[j].score > pool[j-1].score; j-- {
			pool[j], pool[j-1] = pool[j-1], pool[j]
		}
	}

	// Take top 5
	limit := 5
	if len(pool) < limit {
		limit = len(pool)
	}

	recs := make([]Recommendation, limit)
	for i := range recs {
		recs[i] = Recommendation{
			ExternalID: pool[i].card.ExternalID,
			Reason:     pool[i].reason,
		}
	}

	reasoning := fmt.Sprintf(
		"Based on your basket (dominant color: %s, main set: %s).",
		dominantColor, dominantSet,
	)
	if len(recs) == 0 {
		reasoning = "No complementary cards found in the candidate pool."
	}

	return RecommendationResult{Recommendations: recs, Reasoning: reasoning}
}

func topKey(m map[string]int) string {
	best, bestVal := "", 0
	for k, v := range m {
		if v > bestVal {
			best, bestVal = k, v
		}
	}
	return best
}

func hasHighRarity(basket []BasketItem) bool {
	for _, b := range basket {
		if b.Rarity == "SR" || b.Rarity == "R" {
			return true
		}
	}
	return false
}

func hasLeader(basket []BasketItem) bool {
	for _, b := range basket {
		if b.CardType == "Leader" || b.Rarity == "L" {
			return true
		}
	}
	return false
}

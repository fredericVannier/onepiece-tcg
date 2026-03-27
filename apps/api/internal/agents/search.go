package agents

import "strings"

// SearchFilters is the structured output of the SearchAgent.
type SearchFilters struct {
	Name     string `json:"name"`
	Color    string `json:"color"`
	Rarity   string `json:"rarity"`
	CardType string `json:"card_type"`
	CardSet  string `json:"card_set"`
}

// NaturalSearch converts a free-text query into structured card filters
// using rule-based keyword matching (no API key required).
//
// Examples:
//
//	"luffy rouge pas cher"  → {Name:"luffy", Color:"Red", Rarity:"C,UC"}
//	"leaders OP01"          → {CardType:"Leader", CardSet:"OP01"}
func NaturalSearch(query string) SearchFilters {
	words := strings.Fields(strings.ToLower(query))
	var filters SearchFilters
	var nameWords []string

	for i, w := range words {
		switch {
		// ── Colors (FR + EN) ──────────────────────────────────────────
		case w == "rouge" || w == "red":
			filters.Color = "Red"
		case w == "vert" || w == "green":
			filters.Color = "Green"
		case w == "bleu" || w == "blue":
			filters.Color = "Blue"
		case w == "violet" || w == "purple":
			filters.Color = "Purple"
		case w == "jaune" || w == "yellow":
			filters.Color = "Yellow"
		case w == "noir" || w == "black":
			filters.Color = "Black"

		// ── Rarities ──────────────────────────────────────────────────
		case w == "leader" || w == "leaders":
			filters.CardType = "Leader"
		case w == "sr" || w == "secret" || (w == "rare" && i > 0 && words[i-1] == "secret"):
			filters.Rarity = "SR"
		case w == "commune" || w == "common" || w == "communes" || w == "commons":
			filters.Rarity = "C"
		case w == "uncommon" || w == "uc" || (w == "commune" && i > 0 && words[i-1] == "peu"):
			filters.Rarity = "UC"

		// "pas cher" / "cheap" → common + uncommon
		case w == "cheap" || (w == "cher" && i > 0 && words[i-1] == "pas"):
			filters.Rarity = "C,UC"
		case w == "cher" || w == "expensive" || w == "rare":
			if filters.Rarity == "" {
				filters.Rarity = "SR,R"
			}

		// ── Card types ────────────────────────────────────────────────
		case w == "character" || w == "personnage" || w == "perso":
			filters.CardType = "Character"
		case w == "event" || w == "événement" || w == "evenement":
			filters.CardType = "Event"
		case w == "stage" || w == "terrain":
			filters.CardType = "Stage"

		// ── Set codes — match OP01..OP16, ST01..ST30, EB01..EB04 ──────
		default:
			up := strings.ToUpper(w)
			if isSetCode(up) {
				filters.CardSet = up
			} else {
				// Not a keyword — treat as part of the card name
				nameWords = append(nameWords, w)
			}
		}
	}

	// Anything left over is the name query (skip stop words)
	var cleanName []string
	for _, w := range nameWords {
		if !isStopWord(w) {
			cleanName = append(cleanName, w)
		}
	}
	if len(cleanName) > 0 {
		filters.Name = strings.Join(cleanName, " ")
	}

	return filters
}

// isSetCode returns true for patterns like OP01, ST12, EB03, PRB01.
func isSetCode(s string) bool {
	if len(s) < 3 {
		return false
	}
	prefixes := []string{"OP", "ST", "EB", "PRB", "P"}
	for _, p := range prefixes {
		if strings.HasPrefix(s, p) {
			rest := s[len(p):]
			if len(rest) >= 1 && len(rest) <= 2 {
				allDigits := true
				for _, c := range rest {
					if c < '0' || c > '9' {
						allDigits = false
						break
					}
				}
				if allDigits {
					return true
				}
			}
		}
	}
	return false
}

var stopWords = map[string]bool{
	"de": true, "le": true, "la": true, "les": true, "du": true, "des": true,
	"un": true, "une": true, "et": true, "ou": true, "avec": true, "pour": true,
	"dans": true, "sur": true, "the": true, "a": true, "an": true, "and": true,
	"or": true, "with": true, "for": true, "in": true, "of": true,
	"pas": true, "peu": true,
}

func isStopWord(w string) bool {
	return stopWords[w]
}

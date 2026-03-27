package agents

import (
	"fmt"
	"io"
	"strings"
)

// ChatMessage is a single turn in the devis conversation.
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// DevisBasketItem extends BasketItem with quantity for the chat context.
type DevisBasketItem struct {
	ExternalID string  `json:"external_id"`
	Name       string  `json:"name"`
	Rarity     string  `json:"rarity"`
	Price      float64 `json:"price"`
	Qty        int     `json:"qty"`
}

// ChatDevis generates a rule-based reply for the devis assistant
// and writes it as SSE to w (no API key required).
func ChatDevis(messages []ChatMessage, basket []DevisBasketItem, w io.Writer) error {
	if len(messages) == 0 {
		return nil
	}
	lastMsg := strings.ToLower(messages[len(messages)-1].Content)

	reply := buildReply(lastMsg, basket)

	// Write as SSE tokens (simulate streaming word by word)
	words := strings.Fields(reply)
	for i, word := range words {
		token := word
		if i < len(words)-1 {
			token += " "
		}
		fmt.Fprintf(w, "data: %s\n\n", escapeSSE(token))
		if f, ok := w.(interface{ Flush() }); ok {
			f.Flush()
		}
	}
	fmt.Fprintf(w, "data: [DONE]\n\n")
	if f, ok := w.(interface{ Flush() }); ok {
		f.Flush()
	}
	return nil
}

func buildReply(question string, basket []DevisBasketItem) string {
	// Total calculation
	var total float64
	var totalQty int
	for _, item := range basket {
		qty := item.Qty
		if qty <= 0 {
			qty = 1
		}
		total += item.Price * float64(qty)
		totalQty += qty
	}

	switch {
	case contains(question, "total", "prix", "price", "combien", "coût", "cout", "coute", "coûte"):
		if totalQty == 0 {
			return "Votre panier est vide pour l'instant."
		}
		return fmt.Sprintf(
			"Votre panier contient %d carte(s) pour un total de %.2f €. "+
				"Pour valider votre devis, cliquez sur « Envoyer le devis par email » dans l'onglet Basket.",
			totalQty, total,
		)

	case contains(question, "livraison", "delivery", "shipping", "envoyer", "envoi"):
		return "Les modalités de livraison sont précisées dans le devis envoyé par email. " +
			"N'hésitez pas à nous contacter directement pour toute question."

	case contains(question, "disponible", "stock", "dispo", "available"):
		return "La disponibilité des cartes est confirmée lors du traitement de votre devis. " +
			"Nous vous recontactons par email dans les 24h."

	case contains(question, "paiement", "payment", "payer", "pay", "virement", "carte"):
		return "Nous acceptons les virements bancaires et les paiements par carte. " +
			"Les détails vous seront communiqués par email après envoi du devis."

	case contains(question, "annuler", "cancel", "supprimer", "modifier", "changer"):
		return "Vous pouvez modifier votre panier librement avant d'envoyer le devis. " +
			"Après envoi, contactez-nous directement par email pour toute modification."

	case contains(question, "bonjour", "hello", "salut", "hi", "bonsoir"):
		return "Bonjour ! Comment puis-je vous aider avec votre sélection de cartes One Piece TCG ?"

	case contains(question, "merci", "thanks", "thank you"):
		return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions."

	case contains(question, "rareté", "rarete", "rarity", "sr", "rare", "leader"):
		return "Les raretés disponibles sont : Leader (L), Secret Rare (SR), Rare (R), Peu Commune (UC) et Commune (C). " +
			"Les prix varient en conséquence — les SR peuvent atteindre 50 € selon la demande."

	case contains(question, "délai", "delai", "temps", "when", "quand"):
		return "Le traitement des devis prend généralement 24 à 48h ouvrées. " +
			"Vous recevrez une confirmation par email."

	default:
		if totalQty > 0 {
			return fmt.Sprintf(
				"Votre panier contient actuellement %d carte(s) (%.2f € au total). "+
					"Je peux vous aider avec les questions de prix, disponibilité, livraison ou paiement.",
				totalQty, total,
			)
		}
		return "Je suis là pour vous aider avec votre devis. " +
			"Posez-moi des questions sur les prix, la disponibilité, la livraison ou le processus de commande."
	}
}

func contains(s string, keywords ...string) bool {
	for _, kw := range keywords {
		if strings.Contains(s, kw) {
			return true
		}
	}
	return false
}

func escapeSSE(s string) string {
	return strings.ReplaceAll(s, "\n", "\\n")
}

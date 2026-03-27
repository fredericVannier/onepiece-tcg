// PricingAgent seeds deterministic prices for cards using FNV hash + rarity ranges.
// No API key required.
//
// Usage:
//
//	cd apps/api && go run ./cmd/agents/pricing
//	cd apps/api && go run ./cmd/agents/pricing --set OP01
//	cd apps/api && go run ./cmd/agents/pricing --all   # re-price all cards
package main

import (
	"flag"
	"fmt"
	"hash/fnv"
	"log"
	"math"
	"strings"

	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"onepiece-tcg-api/internal/cards"
	"onepiece-tcg-api/internal/database"
)

func main() {
	setFlag := flag.String("set", "", "Price only this set code (e.g. OP01)")
	allFlag := flag.Bool("all", false, "Re-price all cards, not just zero-price ones")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("No .env, using system env")
	}

	db, err := database.New()
	if err != nil {
		log.Fatalf("DB: %v", err)
	}

	q := db.Model(&cards.CardEntity{})
	if *setFlag != "" {
		q = q.Where("external_id LIKE ?", strings.ToUpper(*setFlag)+"-%")
	}
	if !*allFlag {
		q = q.Where("price = 0 OR price IS NULL")
	}

	var targets []cards.CardEntity
	q.Find(&targets)

	if len(targets) == 0 {
		fmt.Println("✓ No cards to price.")
		return
	}

	fmt.Printf("Pricing %d cards…\n", len(targets))
	updated := updatePrices(db, targets)
	fmt.Printf("✓ Done. %d cards updated.\n", updated)

	// Summary by rarity
	type row struct {
		Rarity string
		Count  int64
	}
	var summary []row
	db.Raw("SELECT rarity, COUNT(*) AS count FROM cards WHERE price > 0 GROUP BY rarity ORDER BY rarity").Scan(&summary)
	fmt.Println("\nPriced cards by rarity:")
	for _, r := range summary {
		fmt.Printf("  %-4s  %d\n", r.Rarity, r.Count)
	}
}

func updatePrices(db *gorm.DB, targets []cards.CardEntity) int {
	updated := 0
	for _, c := range targets {
		price := computePrice(c.ExternalID, c.Rarity)
		res := db.Model(&cards.CardEntity{}).Where("id = ?", c.ID).Update("price", price)
		if res.Error == nil {
			updated += int(res.RowsAffected)
		}
	}
	return updated
}

func computePrice(externalID, rarity string) float64 {
	h := fnv.New32a()
	h.Write([]byte(externalID))
	t := float64(h.Sum32()) / float64(math.MaxUint32)
	var lo, hi float64
	switch rarity {
	case "L":
		lo, hi = 15, 40
	case "SR":
		lo, hi = 8, 50
	case "R":
		lo, hi = 2, 15
	case "UC":
		lo, hi = 0.50, 3
	default:
		lo, hi = 0.10, 1.50
	}
	return math.Round((lo+t*(hi-lo))*100) / 100
}

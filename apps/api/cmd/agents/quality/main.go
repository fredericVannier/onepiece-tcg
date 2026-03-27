// QualityAgent audits the card database and prints a quality report.
// No API key required.
//
// Usage:
//
//	cd apps/api && go run ./cmd/agents/quality
package main

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"

	"onepiece-tcg-api/internal/database"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env, using system env")
	}

	db, err := database.New()
	if err != nil {
		log.Fatalf("DB: %v", err)
	}

	fmt.Println("=== QualityAgent Report ===")
	fmt.Println()

	// Total cards
	var total int64
	db.Raw("SELECT COUNT(*) FROM cards").Scan(&total)
	fmt.Printf("Total cards: %d\n\n", total)

	// Rarity distribution
	var rarities []struct {
		Rarity string
		Count  int
	}
	db.Raw("SELECT rarity, COUNT(*) AS count FROM cards GROUP BY rarity ORDER BY count DESC").Scan(&rarities)
	fmt.Println("── Rarity distribution ──────────────────")
	for _, r := range rarities {
		fmt.Printf("  %-4s  %d\n", r.Rarity, r.Count)
	}
	fmt.Println()

	// Sets
	var sets []struct {
		SetCode string
		Count   int
	}
	db.Raw(`SELECT SPLIT_PART(external_id, '-', 1) AS set_code, COUNT(*) AS count FROM cards GROUP BY set_code ORDER BY set_code`).Scan(&sets)
	fmt.Printf("── Sets in DB (%d) ───────────────────────\n", len(sets))
	for _, s := range sets {
		fmt.Printf("  %-8s  %d cards\n", s.SetCode, s.Count)
	}
	fmt.Println()

	// Issues
	fmt.Println("── Issues ───────────────────────────────")

	var missingImages int64
	db.Raw("SELECT COUNT(*) FROM cards WHERE image_url = '' OR image_url IS NULL").Scan(&missingImages)
	icon := "🟢"
	if missingImages > 0 {
		icon = "🔴"
	}
	fmt.Printf("  %s Missing images   : %d\n", icon, missingImages)

	var zeroPrices int64
	db.Raw("SELECT COUNT(*) FROM cards WHERE price = 0 OR price IS NULL").Scan(&zeroPrices)
	icon = "🟢"
	if zeroPrices > int64(float64(total)*0.1) {
		icon = "🔴"
	} else if zeroPrices > 0 {
		icon = "🟡"
	}
	fmt.Printf("  %s Zero prices       : %d\n", icon, zeroPrices)

	var emptyNames int64
	db.Raw("SELECT COUNT(*) FROM cards WHERE name = '' OR name IS NULL").Scan(&emptyNames)
	icon = "🟢"
	if emptyNames > 0 {
		icon = "🔴"
	}
	fmt.Printf("  %s Empty names       : %d\n", icon, emptyNames)

	var duplicates int64
	db.Raw("SELECT COUNT(*) FROM (SELECT external_id FROM cards GROUP BY external_id HAVING COUNT(*) > 1) AS dups").Scan(&duplicates)
	icon = "🟢"
	if duplicates > 0 {
		icon = "🔴"
	}
	fmt.Printf("  %s Duplicate IDs     : %d\n", icon, duplicates)

	fmt.Println()

	// Recommendations
	fmt.Println("── Recommendations ──────────────────────")
	if missingImages > 0 {
		fmt.Printf("  → Re-run the scraper for sets with missing images\n")
	}
	if zeroPrices > 0 {
		fmt.Printf("  → Run: go run ./cmd/price-seeder  (or ./cmd/agents/set-watcher)\n")
	}
	if duplicates > 0 {
		fmt.Printf("  → Investigate duplicate external_ids in the database\n")
	}
	if missingImages == 0 && zeroPrices == 0 && emptyNames == 0 && duplicates == 0 {
		fmt.Println("  ✓ No issues found.")
	}
	fmt.Println()
}

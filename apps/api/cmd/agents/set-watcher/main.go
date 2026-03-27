// SetWatcherAgent detects sets missing from the database, scrapes them,
// imports them, and seeds prices — no API key required.
//
// Usage:
//
//	cd apps/api && go run ./cmd/agents/set-watcher
package main

import (
	"encoding/json"
	"fmt"
	"hash/fnv"
	"log"
	"math"
	"os"
	"sort"

	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"onepiece-tcg-api/internal/cards"
	"onepiece-tcg-api/internal/database"
	"onepiece-tcg-api/internal/importer"
	"onepiece-tcg-api/internal/scraper"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env, using system env")
	}

	db, err := database.New()
	if err != nil {
		log.Fatalf("DB: %v", err)
	}

	// 1. Find missing sets
	var rows []struct{ Code string }
	db.Raw(`SELECT DISTINCT SPLIT_PART(external_id, '-', 1) AS code FROM cards`).Scan(&rows)
	inDB := make(map[string]bool, len(rows))
	for _, r := range rows {
		inDB[r.Code] = true
	}
	var missing []string
	for _, code := range scraper.KnownSets() {
		if !inDB[code] {
			missing = append(missing, code)
		}
	}
	sort.Strings(missing)

	fmt.Printf("Sets in DB   : %d\n", len(inDB))
	fmt.Printf("Missing sets : %d → %v\n", len(missing), missing)

	// 2. Scrape + import if anything is missing
	if len(missing) > 0 {
		scrapeAndImport(db, missing)
	} else {
		fmt.Println("✓ Database is up to date.")
	}

	// 3. Seed prices for any unpriced cards
	seedZeroPrices(db)
}

func scrapeAndImport(db *gorm.DB, setCodes []string) {
	const dataPath = "../../data/cards.json"

	existing, err := loadJSON(dataPath)
	if err != nil {
		log.Fatalf("load cards.json: %v", err)
	}
	seen := make(map[string]bool, len(existing))
	for _, c := range existing {
		seen[c.CardNum] = true
	}

	perSet := map[string]int{}
	var newCards []scraper.Card

	for _, code := range setCodes {
		log.Printf("[SetWatcher] Scraping %s…", code)
		scraped, err := scraper.ScrapeSet(code)
		if err != nil {
			log.Printf("[SetWatcher] %s error: %v", code, err)
			perSet[code] = -1
			continue
		}
		added := 0
		for _, c := range scraped {
			if !seen[c.CardNum] {
				newCards = append(newCards, c)
				seen[c.CardNum] = true
				added++
			}
		}
		perSet[code] = added
	}

	if len(newCards) > 0 {
		if err := saveJSON(dataPath, append(existing, newCards...)); err != nil {
			log.Fatalf("save cards.json: %v", err)
		}
		if err := importer.ImportCards(dataPath, db); err != nil {
			log.Fatalf("import: %v", err)
		}
	}

	fmt.Println("\n=== SetWatcher Report ===")
	for _, code := range setCodes {
		n := perSet[code]
		if n < 0 {
			fmt.Printf("  ✗ %s — scrape failed\n", code)
		} else {
			fmt.Printf("  ✓ %s — %d new cards\n", code, n)
		}
	}
	fmt.Printf("  Total imported: %d cards\n", len(newCards))
}

func seedZeroPrices(db *gorm.DB) {
	var unseeded []cards.CardEntity
	db.Where("price = 0 OR price IS NULL").Find(&unseeded)
	if len(unseeded) == 0 {
		fmt.Println("✓ All cards already priced.")
		return
	}
	for _, c := range unseeded {
		price := computePrice(c.ExternalID, c.Rarity)
		db.Model(&cards.CardEntity{}).Where("id = ?", c.ID).Update("price", price)
	}
	fmt.Printf("✓ Seeded prices for %d cards\n", len(unseeded))
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

func loadJSON(path string) ([]scraper.Card, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var c []scraper.Card
	return c, json.Unmarshal(data, &c)
}

func saveJSON(path string, c []scraper.Card) error {
	data, err := json.MarshalIndent(c, "", "    ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

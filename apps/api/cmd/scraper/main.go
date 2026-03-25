package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"

	"onepiece-tcg-api/internal/scraper"
)

func main() {
	setFlag := flag.String("set", "", "Set code to scrape, e.g. OP15, EB03 (comma-separated for multiple)")
	missingFlag := flag.Bool("missing", false, "Auto-detect and scrape sets not yet in cards.json")
	dataPath := flag.String("data", "../../data/cards.json", "Path to cards.json")
	flag.Parse()

	if !*missingFlag && *setFlag == "" {
		fmt.Println("Usage:")
		fmt.Println("  Scrape specific set(s):")
		fmt.Println("    go run ./cmd/scraper --set OP15")
		fmt.Println("    go run ./cmd/scraper --set OP15,EB03")
		fmt.Println("  Auto-detect missing sets:")
		fmt.Println("    go run ./cmd/scraper --missing")
		fmt.Println("\nKnown set codes:", strings.Join(sortedSets(), ", "))
		os.Exit(1)
	}

	// Load existing cards.json
	existing, err := loadCards(*dataPath)
	if err != nil {
		log.Fatalf("failed to read %s: %v", *dataPath, err)
	}
	existingByNum := make(map[string]bool, len(existing))
	existingSets := make(map[string]bool)
	for _, c := range existing {
		existingByNum[c.CardNum] = true
		// Extract set prefix from "#OP01-001" → "OP01"
		num := strings.TrimPrefix(c.CardNum, "#")
		if idx := strings.Index(num, "-"); idx > 0 {
			existingSets[num[:idx]] = true
		}
	}

	// Determine which sets to scrape
	var setsToScrape []string
	if *missingFlag {
		for _, code := range sortedSets() {
			if !existingSets[code] {
				setsToScrape = append(setsToScrape, code)
			}
		}
		if len(setsToScrape) == 0 {
			log.Println("No missing sets detected — cards.json is already up to date.")
			return
		}
		log.Printf("Missing sets detected: %s", strings.Join(setsToScrape, ", "))
	} else {
		for _, code := range strings.Split(*setFlag, ",") {
			setsToScrape = append(setsToScrape, strings.TrimSpace(strings.ToUpper(code)))
		}
	}

	// Scrape each set and collect new cards
	var newCards []scraper.Card
	for _, code := range setsToScrape {
		log.Printf("Scraping %s...", code)
		cards, err := scraper.ScrapeSet(code)
		if err != nil {
			log.Printf("  ERROR: %v", err)
			continue
		}

		added := 0
		for _, c := range cards {
			if !existingByNum[c.CardNum] {
				newCards = append(newCards, c)
				existingByNum[c.CardNum] = true
				added++
			}
		}
		log.Printf("  Found %d cards, %d new", len(cards), added)
	}

	if len(newCards) == 0 {
		log.Println("No new cards to add.")
		return
	}

	// Append new cards and write back
	updated := append(existing, newCards...)
	if err := saveCards(*dataPath, updated); err != nil {
		log.Fatalf("failed to write %s: %v", *dataPath, err)
	}

	log.Printf("Done — added %d new cards. Total: %d cards in %s", len(newCards), len(updated), *dataPath)
	log.Println("Run the importer to sync to the database:")
	log.Println("  cd apps/api && go run ./cmd/importer")
}

func loadCards(path string) ([]scraper.Card, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cards []scraper.Card
	if err := json.Unmarshal(data, &cards); err != nil {
		return nil, err
	}
	return cards, nil
}

func saveCards(path string, cards []scraper.Card) error {
	data, err := json.MarshalIndent(cards, "", "    ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func sortedSets() []string {
	sets := scraper.KnownSets()
	sort.Strings(sets)
	return sets
}

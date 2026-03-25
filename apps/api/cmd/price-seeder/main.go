package main

import (
	"fmt"
	"hash/fnv"
	"log"
	"math"

	"github.com/joho/godotenv"
	"onepiece-tcg-api/internal/cards"
	"onepiece-tcg-api/internal/database"
)

// fakePrice generates a deterministic price based on the card's external_id and rarity.
// Using FNV hash so prices are consistent across runs.
func fakePrice(externalID, rarity string) float64 {
	h := fnv.New32a()
	h.Write([]byte(externalID))
	t := float64(h.Sum32()) / float64(math.MaxUint32) // 0.0 – 1.0

	var min, max float64
	switch rarity {
	case "L":
		min, max = 15, 40   // Leaders are valuable
	case "SR":
		min, max = 8, 50    // Secret Rares vary a lot
	case "R":
		min, max = 2, 15
	case "UC":
		min, max = 0.50, 3
	default: // C, and anything else
		min, max = 0.10, 1.50
	}

	raw := min + t*(max-min)
	return math.Round(raw*100) / 100
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	db, err := database.New()
	if err != nil {
		log.Fatal(err)
	}

	var allCards []cards.CardEntity
	if err := db.Find(&allCards).Error; err != nil {
		log.Fatal(err)
	}

	if err := db.AutoMigrate(&cards.CardEntity{}); err != nil {
		log.Fatal(err)
	}

	log.Printf("Seeding prices for %d cards…", len(allCards))

	for _, c := range allCards {
		price := fakePrice(c.ExternalID, c.Rarity)
		if err := db.Model(&cards.CardEntity{}).Where("id = ?", c.ID).Update("price", price).Error; err != nil {
			log.Printf("failed to update %s: %v", c.ExternalID, err)
		}
	}

	fmt.Printf("Done. Prices seeded for %d cards.\n", len(allCards))
}

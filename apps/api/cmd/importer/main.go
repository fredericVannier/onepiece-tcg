package main

import (
	"log"

	"onepiece-tcg-api/internal/database"
	"onepiece-tcg-api/internal/importer"

	"github.com/joho/godotenv"
)

func main() {

	// Charger .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}

	db, err := database.New()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := importer.ImportCards("../../data/cards.json", db); err != nil {
		log.Fatalf("failed to import cards: %v", err)
	}

	log.Println("Cards imported successfully!")
}

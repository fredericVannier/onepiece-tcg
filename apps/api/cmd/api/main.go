package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/joho/godotenv"
	"onepiece-tcg-api/internal/cards"
	"onepiece-tcg-api/internal/database"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}
	db, err := database.New()
	if err != nil {
		log.Fatal(err)
	}

	// DI (Dependency Injection)
	cardRepo := cards.NewRepository(db)
	cardService := cards.NewService(cardRepo)
	cardHandler := cards.NewHandler(cardService)

	r := chi.NewRouter()

	r.Get("/cards", cardHandler.GetCards)

	log.Println("Server running on :8080")
	http.ListenAndServe(":8080", r)
}

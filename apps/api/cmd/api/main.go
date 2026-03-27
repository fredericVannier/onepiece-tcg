package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"github.com/joho/godotenv"
	"onepiece-tcg-api/internal/cards"
	"onepiece-tcg-api/internal/database"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	db, err := database.New()
	if err != nil {
		log.Fatal(err)
	}

	cardRepo := cards.NewRepository(db)
	cardService := cards.NewService(cardRepo)
	cardHandler := cards.NewHandler(cardService)

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Existing endpoints
	r.Get("/cards", cardHandler.GetCards)
	r.Get("/sets", cardHandler.GetSets)
	r.Get("/images/{cardNum}", cardHandler.ProxyImage)
	r.Post("/devis", cardHandler.SendDevis)

	// Agent endpoints
	r.Post("/search/natural", cardHandler.SearchNatural)
	r.Post("/recommendations", cardHandler.Recommend)
	r.Post("/devis/chat", cardHandler.ChatDevis)

	log.Println("Server running on :8080")
	http.ListenAndServe(":8080", r)
}

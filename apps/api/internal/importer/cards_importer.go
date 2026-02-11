package importer

import (
	"encoding/json"
	"os"
	"strconv"

	"onepiece-tcg-api/internal/cards"

	"gorm.io/gorm"
)

type CardJSON struct {
	CardNum   string   `json:"CardNum"`
	Rarity    string   `json:"Rarity"`
	CardType  string   `json:"CardType"`
	Name      string   `json:"Name"`
	Img       string   `json:"Img"`
	Cost      string   `json:"Cost"`
	Attribute string   `json:"Attribute"`
	Power     string   `json:"Power"`
	Counter   string   `json:"Counter"`
	Color     string   `json:"Color"`
	Block     string   `json:"Block"`
	Type      string   `json:"Type"`
	Effect    string   `json:"Effect"`
	CardSets  string   `json:"CardSets"`
	Images    []string `json:"Images"`
}

func ImportCards(path string, db *gorm.DB) error {
	file, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var cardsJSON []CardJSON
	err = json.Unmarshal(file, &cardsJSON)
	if err != nil {
		return err
	}

	for _, c := range cardsJSON {
		cost, _ := strconv.Atoi(c.Cost)
		power, _ := strconv.Atoi(c.Power)

		firstImage := ""
		if len(c.Images) > 0 {
			firstImage = c.Images[0]
		}

		card := cards.CardEntity{
			ExternalID: c.CardNum,
			Name:       c.Name,
			Color:      c.Color,
			Cost:       cost,
			Power:      power,
			ImageURL:   firstImage,
			Rarity:     c.Rarity,
			Effect:     c.Effect,
			CardType:   c.CardType,
			Attribute:  c.Attribute,
			Block:      c.Block,
			Counter:    c.Counter,
			CardSets:   c.CardSets,
		}

		if err := db.Create(&card).Error; err != nil {
			return err
		}
	}

	return nil
}

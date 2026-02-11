package cards

import "gorm.io/gorm"

type CardEntity struct {
	gorm.Model
	ExternalID string `gorm:"uniqueIndex"` // correspond à CardNum
	Name       string
	Color      string
	Cost       int
	Power      int
	ImageURL   string
	Rarity     string
	Effect     string
	CardType   string
	Attribute  string
	Block      string
	Counter    string
	CardSets   string
}

func (CardEntity) TableName() string {
	return "cards"
}

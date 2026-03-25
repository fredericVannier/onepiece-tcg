package cards

type CardEntity struct {
	ID         uint   `json:"id"`
	ExternalID string `json:"external_id"`
	Name       string `json:"name"`
	Color      string `json:"color"`
	Cost       int    `json:"cost"`
	Power      int    `json:"power"`
	ImageURL   string `json:"image_url"`
	Rarity     string `json:"rarity"`
	Effect     string `json:"effect"`
	CardType   string `json:"card_type"`
	Attribute  string `json:"attribute"`
	Block      string `json:"block"`
	Counter    string `json:"counter"`
	CardSets   string  `json:"card_sets"`
	Price      float64 `json:"price"`
}

func (CardEntity) TableName() string {
	return "cards"
}

package cards

import (
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetAll() ([]CardEntity, error) {
	var cards []CardEntity
	err := r.db.Find(&cards).Error
	return cards, err
}

func (r *Repository) FindAll(limit int, offset int) ([]CardEntity, error) {
	var cards []CardEntity

	err := r.db.
		Limit(limit).
		Offset(offset).
		Find(&cards).Error

	return cards, err
}

type SetInfo struct {
	Code     string `json:"code"`
	Name     string `json:"name"`
	Sample   string `gorm:"column:sample" json:"-"`
}

func (r *Repository) GetSets() ([]SetInfo, error) {
	var rows []SetInfo
	err := r.db.Raw(`
		SELECT
			SPLIT_PART(external_id, '-', 1) AS code,
			MIN(card_sets) AS sample
		FROM cards
		WHERE card_sets != ''
		GROUP BY SPLIT_PART(external_id, '-', 1)
		ORDER BY code
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for i := range rows {
		rows[i].Name = parseSetName(rows[i].Sample)
	}
	return rows, nil
}

// parseSetName extracts the human-readable name from a card_sets value.
// e.g. "Card Set(s)-ROMANCE DAWN- [OP01]" → "ROMANCE DAWN"
func parseSetName(cardSets string) string {
	s := strings.TrimPrefix(cardSets, "Card Set(s)-")
	if idx := strings.LastIndex(s, "- ["); idx > 0 {
		s = s[:idx]
	} else if idx := strings.LastIndex(s, " ["); idx > 0 {
		s = s[:idx]
	}
	return strings.Trim(s, "- ")
}

func (r *Repository) Search(
	name string,
	color string,
	rarity string,
	cardType string,
	cardSet string,
	page int,
	limit int,
) ([]CardEntity, int64, error) {

	var cards []CardEntity
	var total int64

	offset := (page - 1) * limit

	query := r.db.Model(&CardEntity{})

	if name != "" {
		query = query.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(name)+"%")
	}
	if color != "" {
		query = query.Where("color = ?", color)
	}
	if rarity != "" {
		query = query.Where("rarity = ?", rarity)
	}
	if cardType != "" {
		query = query.Where("card_type = ?", cardType)
	}
	if cardSet != "" {
		query = query.Where("external_id LIKE ?", strings.ToUpper(cardSet)+"-%")
	}

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Data paginée
	if err := query.
		Limit(limit).
		Offset(offset).
		Find(&cards).Error; err != nil {
		return nil, 0, err
	}

	return cards, total, nil
}
func (r *Repository) Upsert(card CardEntity) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "external_id"}},
		UpdateAll: true,
	}).Create(&card).Error
}

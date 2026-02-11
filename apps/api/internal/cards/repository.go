package cards

import (
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

func (r *Repository) Upsert(card CardEntity) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "external_id"}},
		UpdateAll: true,
	}).Create(&card).Error
}

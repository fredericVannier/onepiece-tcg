package cards

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetCards() ([]CardEntity, error) {
	return s.repo.GetAll()
}

func (s *Service) GetAllCards(limit int, offset int) ([]CardEntity, error) {
	return s.repo.FindAll(limit, offset)
}

func (s *Service) GetSets() ([]SetInfo, error) {
	return s.repo.GetSets()
}

func (s *Service) SearchCards(
	name string,
	color string,
	rarity string,
	cardType string,
	cardSet string,
	page int,
	limit int,
) ([]CardEntity, int64, error) {
	return s.repo.Search(name, color, rarity, cardType, cardSet, page, limit)
}

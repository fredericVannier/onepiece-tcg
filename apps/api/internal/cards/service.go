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

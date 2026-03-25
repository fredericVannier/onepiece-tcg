package cards

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"os"
	"strings"
)

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

func (s *Service) SendDevis(items []DevisItem) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	to := os.Getenv("DEVIS_TO")

	if host == "" || user == "" || pass == "" {
		return fmt.Errorf("SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env")
	}

	// Build email body
	var sb strings.Builder
	sb.WriteString("Bonjour,\n\nVoici le devis pour votre sélection de cartes One Piece TCG :\n\n")
	sb.WriteString(fmt.Sprintf("%-40s %-6s %s\n", "Carte", "Rareté", "Prix"))
	sb.WriteString(strings.Repeat("-", 60) + "\n")
	var total float64
	for _, item := range items {
		sb.WriteString(fmt.Sprintf("%-40s %-6s %.2f €\n", item.Name, item.Rarity, item.Price))
		total += item.Price
	}
	sb.WriteString(strings.Repeat("-", 60) + "\n")
	sb.WriteString(fmt.Sprintf("%-47s %.2f €\n", "TOTAL", total))
	sb.WriteString("\nCordialement,\nOne Piece TCG Shop\n")

	subject := fmt.Sprintf("Devis One Piece TCG — %d carte(s) — %.2f €", len(items), total)
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		user, to, subject, sb.String())

	addr := host + ":" + port
	auth := smtp.PlainAuth("", user, pass, host)

	// STARTTLS (Gmail port 587)
	conn, err := tls.Dial("tcp", host+":465", &tls.Config{ServerName: host})
	if err != nil {
		// Fall back to STARTTLS on port 587
		if err2 := smtp.SendMail(addr, auth, user, []string{to}, []byte(msg)); err2 != nil {
			return fmt.Errorf("smtp error: %w", err2)
		}
		return nil
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("smtp client: %w", err)
	}
	defer client.Quit()
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}
	if err := client.Mail(user); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}
	wc, err := client.Data()
	if err != nil {
		return err
	}
	defer wc.Close()
	_, err = fmt.Fprint(wc, msg)
	return err
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

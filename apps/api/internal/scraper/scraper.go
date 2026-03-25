package scraper

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// Card matches the JSON format used by the existing cards.json / importer.
type Card struct {
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

// seriesIDs maps human-friendly set codes to the numeric ID used by the official website.
// Pattern: OP-XX → 5691XX, ST-XX → 5690XX, EB-XX → 5692XX, PRB-XX → 5693XX
var seriesIDs = map[string]string{
	// Booster packs
	"OP01": "569101", "OP02": "569102", "OP03": "569103", "OP04": "569104",
	"OP05": "569105", "OP06": "569106", "OP07": "569107", "OP08": "569108",
	"OP09": "569109", "OP10": "569110", "OP11": "569111", "OP12": "569112",
	"OP13": "569113", "OP14": "569114", "OP15": "569115", "OP16": "569116",
	// Starter decks
	"ST01": "569001", "ST02": "569002", "ST03": "569003", "ST04": "569004",
	"ST05": "569005", "ST06": "569006", "ST07": "569007", "ST08": "569008",
	"ST09": "569009", "ST10": "569010", "ST11": "569011", "ST12": "569012",
	"ST13": "569013", "ST14": "569014", "ST15": "569015", "ST16": "569016",
	"ST17": "569017", "ST18": "569018", "ST19": "569019", "ST20": "569020",
	"ST21": "569021", "ST22": "569022", "ST23": "569023", "ST24": "569024",
	"ST25": "569025", "ST26": "569026", "ST27": "569027", "ST28": "569028",
	"ST29": "569029", "ST30": "569030",
	// Extra boosters
	"EB01": "569201", "EB02": "569202", "EB03": "569203", "EB04": "569204",
	// Premium boosters
	"PRB01": "569301", "PRB02": "569302",
	// Promos
	"P": "569901",
}

// KnownSets returns all set codes in the map.
func KnownSets() []string {
	sets := make([]string, 0, len(seriesIDs))
	for k := range seriesIDs {
		sets = append(sets, k)
	}
	return sets
}

// ScrapeSet fetches all cards for the given set code (e.g. "OP15") from the official website.
func ScrapeSet(setCode string) ([]Card, error) {
	id, ok := seriesIDs[strings.ToUpper(setCode)]
	if !ok {
		return nil, fmt.Errorf("unknown set code %q — use one of the known codes (OP01..OP16, ST01..ST30, EB01..EB04, PRB01..PRB02)", setCode)
	}

	url := fmt.Sprintf("https://en.onepiece-cardgame.com/cardlist?series=%s", id)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; optcg-scraper/1.0)")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d for %s", resp.StatusCode, url)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("parse HTML: %w", err)
	}

	var cards []Card
	doc.Find("dl.modalCol").Each(func(_ int, s *goquery.Selection) {
		card := parseCard(s)
		if card.CardNum != "#" {
			cards = append(cards, card)
		}
	})

	if len(cards) == 0 {
		return nil, fmt.Errorf("no cards found for set %s — the series ID %s may be incorrect", setCode, id)
	}

	return cards, nil
}

func parseCard(s *goquery.Selection) Card {
	cardID, _ := s.Attr("id")

	// Rarity and CardType are the 2nd and 3rd <span> inside .infoCol
	spans := s.Find("dt div.infoCol span")
	rarity := strings.TrimSpace(spans.Eq(1).Text())
	cardType := strings.TrimSpace(spans.Eq(2).Text())

	name := strings.TrimSpace(s.Find("dt div.cardName").Text())

	// Image uses lazy-load data-src; URL is relative: "../images/..." → absolute
	imgSrc, _ := s.Find("dd div.frontCol img").Attr("data-src")
	imgURL := toAbsoluteURL(imgSrc)

	cost := statText(s, "div.cost")
	attribute := strings.TrimSpace(s.Find("dd div.backCol div.attribute i").Text())
	power := statText(s, "div.power")
	counter := statText(s, "div.counter")
	color := statText(s, "div.color")
	block := statText(s, "div.block")
	cardSetType := statText(s, "div.feature")
	effect := statText(s, "div.text")
	cardSets := statText(s, "div.getInfo:not(.remarks)")

	return Card{
		CardNum:   "#" + cardID,
		Rarity:    rarity,
		CardType:  cardType,
		Name:      name,
		Img:       imgURL,
		Cost:      cost,
		Attribute: attribute,
		Power:     power,
		Counter:   counter,
		Color:     color,
		Block:     block,
		Type:      cardSetType,
		Effect:    effect,
		CardSets:  cardSets,
		Images:    []string{imgURL},
	}
}

// statText extracts the text content of a field div, stripping the h3 heading label.
func statText(s *goquery.Selection, selector string) string {
	el := s.Find(selector).First()
	if el.Length() == 0 {
		return ""
	}
	full := el.Text()
	heading := el.Find("h3").First().Text()
	return strings.TrimSpace(strings.TrimPrefix(full, heading))
}

func toAbsoluteURL(src string) string {
	if strings.HasPrefix(src, "../") {
		return "https://en.onepiece-cardgame.com/" + src[3:]
	}
	if strings.HasPrefix(src, "/") {
		return "https://en.onepiece-cardgame.com" + src
	}
	return src
}

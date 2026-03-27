# One Piece TCG — Project Overview

Full-stack e-commerce card shop for the One Piece TCG. Browse, filter and add cards to a basket, then send a quote by email. Data is scraped from the official website and stored in PostgreSQL.

## Architecture

Monorepo managed with **pnpm workspaces**:

| Path | Role |
|---|---|
| `apps/web/` | React 19 frontend (Vite + Tailwind CSS v4) |
| `apps/api/` | Go 1.25 REST API (Chi router + GORM) |
| `data/cards.json` | Source card data (2 560+ cards) |
| `database/` | SQL migrations |

## Tech Stack

**Frontend** (`apps/web/`)
- React 19, TypeScript, Vite 7, Tailwind CSS v4, React Router v7
- Dark/light mode toggle persisted to localStorage (`.dark` class on `<html>`)
- `@custom-variant dark` configured in `App.css` for class-based dark mode
- `@keyframes shimmer` defined in `App.css` for hero gradient animation
- `#root` has no max-width — each page manages its own container
- Filters stored in URL search params (shareable, back/forward safe)
- Infinite scroll via `IntersectionObserver` (`InfiniteScrollTrigger` component)
- Basket state managed via React Context (`BasketContext`)

**Backend** (`apps/api/`) — module `onepiece-tcg-api`
- Go + Chi v5 router, GORM ORM, PostgreSQL driver
- CORS allowed for `http://localhost:5173`
- AutoMigrate on startup (no manual migration step needed)
- Image proxy at `GET /images/{cardNum}` — bypasses CORP header on official site
- Devis email sent via Go `net/smtp` (STARTTLS on port 465, fallback STARTTLS on 587)

**Database** — PostgreSQL 16 via Docker
- Port: **5433** (not the default 5432)
- Credentials: user=`op`, password=`op`, db=`op`

## Dev Setup

```bash
# 1. Start the database
docker compose up -d

# 2. Start the API (from repo root)
pnpm dev:api         # → http://localhost:8080

# 3. Start the frontend (from repo root)
pnpm dev:web         # → http://localhost:5173
```

The API auto-migrates the schema on every start. No separate migration command needed.

## Environment Variables

File: `apps/api/.env`

```
DB_HOST=localhost
DB_USER=op
DB_PASSWORD=op
DB_NAME=op
DB_PORT=5433

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password      # Gmail → Security → App passwords (requires 2FA)
DEVIS_TO=youremail@gmail.com
```

## Data Pipeline

### Import existing cards.json → database
```bash
cd apps/api
go run ./cmd/importer
```
Uses upsert (`ON CONFLICT external_id DO UPDATE`) — safe to re-run.

### Seed fake prices into the database
```bash
cd apps/api
go run ./cmd/price-seeder
```
Sets a deterministic price per card based on rarity + FNV hash of `external_id`. Safe to re-run.
Price ranges: L → 15–40 €, SR → 8–50 €, R → 2–15 €, UC → 0.50–3 €, C → 0.10–1.50 €

### Scrape new sets from the official website
```bash
cd apps/api

# Scrape a specific set
go run ./cmd/scraper --set OP15

# Scrape multiple sets
go run ./cmd/scraper --set OP15,EB03

# Auto-detect all sets not yet in cards.json
go run ./cmd/scraper --missing
```
After scraping, re-run the importer to sync to the database.

**Series ID pattern** (in `internal/scraper/scraper.go`):
- OP-XX → `5691XX` (e.g. OP15 = 569115)
- ST-XX → `5690XX`
- EB-XX → `5692XX`
- PRB-XX → `5693XX`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/cards` | Search/filter cards with pagination |
| `GET` | `/sets` | All distinct set codes + names from DB |
| `GET` | `/images/{cardNum}` | Image proxy (e.g. `/images/OP01-001`) |
| `POST` | `/devis` | Send a quote email to `DEVIS_TO` |
| `POST` | `/search/natural` | NLP query → structured filters |
| `POST` | `/recommendations` | Basket → suggested complementary cards |
| `POST` | `/devis/chat` | Devis assistant (SSE streaming) |

### `/cards` query params
`name`, `color`, `rarity`, `cardType`, `cardSet`, `page`, `limit`

### `POST /devis` body
```json
{
  "items": [
    { "external_id": "OP01-001", "name": "Monkey D. Luffy", "rarity": "SR", "price": 24.50 }
  ]
}
```
Returns `204 No Content` on success. Errors 400 if basket empty, 500 if SMTP misconfigured.

### `POST /search/natural` body
```json
{ "query": "luffy rouge pas cher" }
```
Returns `{ "name": "luffy", "color": "Red", "rarity": "C,UC", "card_type": "", "card_set": "" }`.
Rule-based keyword parser (FR + EN). No API key needed.

### `POST /recommendations` body
```json
{ "basket": [{ "external_id": "OP01-001", "name": "...", "color": "Red", "rarity": "SR", "card_type": "Leader", "price": 24.5 }] }
```
Returns `{ "recommendations": [{ "external_id": "...", "reason": "...", "card": {...} }], "reasoning": "..." }`.
Heuristic: score by same set (+3), same color (+2), complementary rarity/type (+1).

### `POST /devis/chat` body
```json
{ "messages": [{ "role": "user", "content": "Quel est le total ?" }], "basket": [...] }
```
Returns SSE stream (`data: token\n\n` … `data: [DONE]\n\n`). Rule-based FAQ bot.

## Frontend Structure

```
apps/web/src/
├── api/          cards.api.ts              — fetchCards(), fetchSets(), searchNatural(),
│                                             fetchRecommendations(), streamChatDevis()
├── components/   BasketModal.tsx           — 3 tabs: Basket / Suggestions / Assistant
│                 CardFilters.tsx           — toggle Filters ↔ AI Search (NaturalSearchBar)
│                 CardModal.tsx             — card detail overlay with price + add-to-basket
│                 DevisChat.tsx             — SSE chat component (FAQ bot)
│                 NaturalSearchBar.tsx      — NLP search bar → fills filter params
│                 InfiniteScrollTrigger.tsx
│                 ScrollToTop.tsx           — floating scroll-to-top button
│                 ThemeToggle.tsx           — floating sun/moon button
├── context/      BasketContext.tsx         — add/remove/has helpers, shared via React Context
├── hooks/        useCards.tsx              — pagination + filter logic with AbortController
├── pages/        CardsPage.tsx             — card catalog page (/cards)
│                 HomePage.tsx              — e-commerce landing page (/)
└── types/        card.ts                   — Card type (snake_case, matches Go JSON tags)
```

## Routing

| Path | Component | Description |
|---|---|---|
| `/` | `HomePage` | Landing page with hero, stats, testimonials, contact |
| `/cards` | `CardsPage` | Full card catalog with filters and infinite scroll |

`App.tsx` wraps everything in `<BasketProvider>`. The `Header` component (defined inside `App.tsx`) consumes `useBasket` to show the basket count badge and toggle `BasketModal`.

## Agents

All agents live in `apps/api/`. They run as standalone CLIs — no API key needed (rule-based).

### Pipeline agents (run manually or on a cron)

| Command | What it does |
|---|---|
| `go run ./cmd/agents/set-watcher` | Détecte sets manquants → scrape → import → seed prix |
| `go run ./cmd/agents/quality` | Audit DB : images manquantes, prix à 0, doublons, distribution |
| `go run ./cmd/agents/pricing` | Seed prix déterministes (FNV hash + plages par rareté) |
| `go run ./cmd/agents/orchestrator` | Lance les 3 agents ci-dessus en séquence |

Options:
```bash
go run ./cmd/agents/pricing --set OP01      # price only one set
go run ./cmd/agents/pricing --all           # re-price all cards
go run ./cmd/agents/orchestrator --skip-pricing
```

### Agent API endpoints (served by the main API)

Implémentés dans `internal/agents/` :
- `search.go` — keyword parser FR/EN → `SearchFilters`
- `recommend.go` — score par set/couleur/type → `RecommendationResult`
- `devis_chat.go` — FAQ bot SSE (total, livraison, paiement, stock…)

### Upgrade vers Claude (futur)

Quand tu auras une clé Anthropic (`ANTHROPIC_API_KEY` dans `.env`), tu pourras remplacer les 3 fichiers ci-dessus par des versions LLM sans toucher aux handlers :
- `search.go` → `NaturalSearch(query string)` via Claude Haiku (tool use `set_filters`)
- `recommend.go` → `Recommend(basket, candidates)` via Claude Haiku
- `devis_chat.go` → `ChatDevis(messages, basket, w)` via streaming Claude Haiku

Le SDK Go est déjà dans `go.mod` (`github.com/anthropics/anthropic-sdk-go`).

## Key Decisions & Gotchas

- **Card images** are proxied through the Go backend (`/images/{cardNum}`) because `en.onepiece-cardgame.com` sends `Cross-Origin-Resource-Policy: same-site` which blocks direct browser loads.
- **`card_type` / `card_sets`** are snake_case in both the Go JSON tags and the TypeScript `Card` type — not camelCase.
- **Tailwind dark mode** uses `@custom-variant dark (&:where(.dark, .dark *))` in `App.css`, NOT the media-query default. Toggle adds/removes `.dark` on `<html>`.
- **Infinite scroll guard**: `loadingRef` and `hasMoreRef` are `useRef` (not state) so the guard inside `loadCards` always reads the current value without stale closure issues.
- **Set names** in the filter dropdown are parsed from the `card_sets` DB field at query time — no hardcoded list needed.
- **Basket** is in-memory only (React Context). Refreshing the page clears it — intentional for a quote/devis flow.
- **Price column**: added to `CardEntity` — AutoMigrate creates it on first API start. Run `cmd/price-seeder` after to populate values.
- **`#root` has no padding/max-width** — `HomePage` is full-bleed dark. `CardsPage` applies its own `max-w-[1280px] mx-auto px-6` wrapper.
- **Animated counters** in the stats section use `IntersectionObserver` + `requestAnimationFrame` with a cubic ease-out. The `started` ref prevents re-triggering on scroll back.

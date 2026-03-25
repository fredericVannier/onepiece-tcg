# One Piece TCG — Project Overview

Full-stack card catalog for the One Piece TCG. Browse, search and filter cards with a clean UI. Data is scraped from the official website and stored in PostgreSQL.

## Architecture

Monorepo managed with **pnpm workspaces**:

| Path | Role |
|---|---|
| `apps/web/` | React 19 frontend (Vite + Tailwind CSS v4) |
| `apps/api/` | Go 1.25 REST API (Chi router + GORM) |
| `data/cards.json` | Source card data (2 274+ cards) |
| `database/` | SQL migrations |

## Tech Stack

**Frontend** (`apps/web/`)
- React 19, TypeScript, Vite 7, Tailwind CSS v4, React Router v7
- Dark/light mode toggle persisted to localStorage (`.dark` class on `<html>`)
- `@custom-variant dark` configured in `App.css` for class-based dark mode
- Filters stored in URL search params (shareable, back/forward safe)
- Infinite scroll via `IntersectionObserver` (`InfiniteScrollTrigger` component)

**Backend** (`apps/api/`) — module `onepiece-tcg-api`
- Go + Chi v5 router, GORM ORM, PostgreSQL driver
- CORS allowed for `http://localhost:5173`
- AutoMigrate on startup (no manual migration step needed)
- Image proxy at `GET /images/{cardNum}` — bypasses CORP header on official site

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
pnpm dev:web         # → http://localhost:5173/cards
```

The API auto-migrates the schema on every start. No separate migration command needed.

## Environment Variables

File: `apps/api/.env` (already committed — dev values only)

```
DB_HOST=localhost
DB_USER=op
DB_PASSWORD=op
DB_NAME=op
DB_PORT=5433
```

## Data Pipeline

### Import existing cards.json → database
```bash
cd apps/api
go run ./cmd/importer
```
Uses upsert (`ON CONFLICT external_id DO UPDATE`) — safe to re-run.

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

### `/cards` query params
`name`, `color`, `rarity`, `cardType`, `cardSet`, `page`, `limit`

## Frontend Structure

```
apps/web/src/
├── api/          cards.api.ts              — fetchCards(), fetchSets()
├── components/   CardFilters.tsx           — search + set/color/rarity selects
│                 CardModal.tsx             — click-to-open card detail overlay
│                 InfiniteScrollTrigger.tsx
│                 ThemeToggle.tsx           — floating sun/moon button
├── hooks/        useCards.tsx              — pagination + filter logic with AbortController
├── pages/        CardsPage.tsx             — main page
└── types/        card.ts                   — Card type (snake_case, matches Go JSON tags)
```

## Key Decisions & Gotchas

- **Card images** are proxied through the Go backend (`/images/{cardNum}`) because `en.onepiece-cardgame.com` sends `Cross-Origin-Resource-Policy: same-site` which blocks direct browser loads.
- **`card_type` / `card_sets`** are snake_case in both the Go JSON tags and the TypeScript `Card` type — not camelCase.
- **Tailwind dark mode** uses `@custom-variant dark (&:where(.dark, .dark *))` in `App.css`, NOT the media-query default. Toggle adds/removes `.dark` on `<html>`.
- **Infinite scroll guard**: `loadingRef` and `hasMoreRef` are `useRef` (not state) so the guard inside `loadCards` always reads the current value without stale closure issues.
- **Set names** in the filter dropdown are parsed from the `card_sets` DB field at query time — no hardcoded list needed.

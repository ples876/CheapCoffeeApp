# CheapCoffeeApp — Architecture & Design

## Goal
A location-aware web app that shows nearby coffee shops and lets users anonymously submit and view coffee prices. Focused on finding cheap coffee in Germany.

## Non-goals
- No user accounts or login
- No storing raw user data (no raw IPs, no sessions)
- No actual menu scraping (coverage too low to be useful)
- Not global — Germany only, EUR only
- No price tier approximations — actual submitted prices only

## Project Structure

```
CheapCoffeeApp/
├── api/      # Hono backend + SQLite database
├── app/      # Vite + React frontend
└── seed/     # Private one-off seeding script (not user-facing)
```

## Backend (`api/`)

**Hono** — HTTP framework for routing and middleware. Minimal, no opinions beyond routing.
**@hono/node-server** — Node.js adapter for Hono (Hono is runtime-agnostic).
**node:sqlite** — Built into Node 24. Chosen over `better-sqlite3` to avoid native compilation (node-gyp) on Windows. Synchronous API, single file on disk. No separate DB process.
**tsx** — Runs TypeScript directly without a compile step. Dev convenience only.

### Endpoints
- `GET /prices?osm_ids=a,b,c` — returns most recent price per drink per shop
- `POST /prices` — submits a price (rate limited by hashed IP)

### Rate Limiting
- Max 5 total submissions per IP per day
- Max 1 submission per IP per shop per drink per 30 days
- IPs are SHA-256 hashed before storage — never stored raw

### Database Schema
Single table `prices`:
```sql
id           INTEGER PRIMARY KEY AUTOINCREMENT
osm_id       TEXT      -- OpenStreetMap node ID
name         TEXT      -- shop name
lat, lon     REAL      -- coordinates (denormalized for simplicity)
drink        TEXT      -- one of 6 drink types (see below)
price_eur    REAL      -- validated: 0.50–15.00
ip_hash      TEXT      -- SHA-256 of submitter IP
submitted_at TEXT      -- datetime, default now
```

Price history is preserved — all submissions kept, most recent is shown.
Seeded entries are identifiable by `ip_hash = 'seed-script'`.

## Frontend (`app/`)

**Vite** — build tool and dev server with hot reload.
**React** — component-based UI. Manages state: location, shops list, prices, selected shop.
**Leaflet** — map rendering on OpenStreetMap tiles. No API key needed. Free. (Map view not yet implemented — list view only currently.)

### Data Flow
1. Browser Geolocation API → `lat`/`lon`
2. Overpass API query → nearby `amenity=cafe` OSM nodes within 1km
3. `GET /prices?osm_ids=...` → price data for found shops
4. Render sorted list (cheapest first by lowest drink price)
5. User taps shop → PriceForm modal → `POST /prices`

## Drink Types (fixed, no free text)
```
schwarzer_klein      Schwarzer Kaffee (klein)
schwarzer_gross      Schwarzer Kaffee (groß)
cappuccino_klein     Cappuccino (klein)
cappuccino_gross     Cappuccino (groß)
espresso_einfach     Espresso (einfach)
espresso_doppelt     Espresso (doppelt)
```
Standardized to 6 types so prices are comparable across shops.
Espresso uses einfach/doppelt (not klein/groß) to match German convention.

## Seeding Script (`seed/`)
A private, manually-run script that pre-populates known shop prices (chains etc.)
directly into the same SQLite file. Not exposed to users. Not a feature.
Uses `node:sqlite` — same as the API, no extra dependencies.
Run via: `cd seed; npm run seed` after filling in OSM IDs from Overpass Turbo.

## External Services
- **Overpass API** (`overpass-api.de`) — free OSM query API. No key needed. Can be throttled under heavy use — add server-side caching (5 min TTL) if traffic grows.
- **OpenStreetMap tiles** via Leaflet — free, no key needed.
- **Browser Geolocation API** — built into all modern browsers.

## Dev
```powershell
# Terminal 1
cd api; npm run dev    # http://localhost:3001

# Terminal 2
cd app; npm run dev    # http://localhost:5173
```

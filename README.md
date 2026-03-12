# CheapCoffeeApp

Find cheap coffee nearby. Germany only. No accounts.

## Structure

- `api/` — Hono + SQLite backend (port 3001)
- `app/` — Vite + React frontend (port 5173)
- `seed/` — Private seeding script, not user-facing

## Dev

```bash
# Terminal 1
cd api && npm install && npm run dev

# Terminal 2
cd app && npm install && npm run dev
```

## Seeding

Edit `seed/src/index.ts` with known OSM IDs and prices, then:

```bash
cd seed && npm install && npm run seed
```

import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync(process.env.DB_PATH ?? "coffee.db");

db.exec(`
  DROP TABLE IF EXISTS prices;

  CREATE TABLE prices (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    osm_id       TEXT NOT NULL,
    name         TEXT NOT NULL,
    lat          REAL NOT NULL,
    lon          REAL NOT NULL,
    drink        TEXT NOT NULL CHECK(drink IN ('schwarzer', 'cappuccino', 'espresso')),
    price_eur    REAL NOT NULL,
    ip_hash      TEXT NOT NULL,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX idx_prices_osm_drink
    ON prices(osm_id, drink, submitted_at DESC);
`);

export default db;

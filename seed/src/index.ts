/**
 * Seeding script — run manually, not exposed to users.
 * Populates known chain prices into the same DB as the API.
 *
 * Usage: npm run seed
 * Points at the API's SQLite file — adjust DB_PATH if needed.
 */

import { DatabaseSync } from "node:sqlite";

const DB_PATH = "../../api/coffee.db"; // relative to this file's location

const db = new DatabaseSync(DB_PATH);

// Chain prices in EUR — update manually as needed
// osm_id is intentionally left as a placeholder pattern:
// match by name when inserting, or pre-fill known OSM IDs for your area
const CHAIN_PRICES: Array<{
  name: string;
  drink: string;
  price_eur: number;
}> = [
  { name: "Starbucks", drink: "cappuccino_klein", price_eur: 4.95 },
  { name: "Starbucks", drink: "cappuccino_gross", price_eur: 5.45 },
  { name: "Starbucks", drink: "espresso_einfach", price_eur: 2.45 },
  { name: "Starbucks", drink: "espresso_doppelt", price_eur: 2.95 },
  // Add more chains + drinks here
];

// To use this script you need to know the OSM IDs for the shops in your area.
// Run the Overpass query below in https://overpass-turbo.eu to find them:
//
//   [out:json];
//   node["amenity"="cafe"]["name"~"Starbucks"](around:5000,YOUR_LAT,YOUR_LON);
//   out body;
//
// Then fill in entries like:
const KNOWN_SHOPS: Array<{
  osm_id: string;
  name: string;
  lat: number;
  lon: number;
  drink: string;
  price_eur: number;
}> = [
  // Example:
  // {
  //   osm_id: "123456789",
  //   name: "Starbucks Marktplatz",
  //   lat: 48.123,
  //   lon: 9.456,
  //   drink: "cappuccino_klein",
  //   price_eur: 4.95,
  // },
];

const IP_HASH_SEED = "seed-script"; // marks seeded entries distinctly

const insert = db.prepare(
  `INSERT INTO prices (osm_id, name, lat, lon, drink, price_eur, ip_hash)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

for (const row of KNOWN_SHOPS) {
  insert.run(
    row.osm_id,
    row.name,
    row.lat,
    row.lon,
    row.drink,
    row.price_eur,
    IP_HASH_SEED
  );
}
console.log(`Seeded ${KNOWN_SHOPS.length} entries.`);

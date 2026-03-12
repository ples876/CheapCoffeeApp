import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { createHash } from "crypto";
import db from "./db.js";

const app = new Hono();

app.use("*", cors({ origin: process.env.ALLOWED_ORIGIN ?? "*" }));

// Global rate limit: 60 requests per IP per minute
const requestCounts = new Map<string, { count: number; resetAt: number }>();
app.use("*", async (c, next) => {
  const ip = c.req.header("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 });
  } else {
    entry.count++;
    if (entry.count > 60) return c.json({ error: "Too many requests" }, 429);
  }
  await next();
});

const DRINK_TYPES = [
  "schwarzer_klein",
  "schwarzer_gross",
  "cappuccino_klein",
  "cappuccino_gross",
  "espresso_einfach",
  "espresso_doppelt",
] as const;

// Rate limit: max 5 submissions per IP per day
function isRateLimited(ipHash: string): boolean {
  const row = db
    .prepare(
      `SELECT COUNT(*) as count FROM prices
       WHERE ip_hash = ? AND submitted_at >= datetime('now', '-1 day')`
    )
    .get(ipHash) as { count: number };
  return row.count >= 5;
}

// Rate limit: max 1 submission per IP per shop per drink per 30 days
function isDuplicateSubmission(
  ipHash: string,
  osmId: string,
  drink: string
): boolean {
  const row = db
    .prepare(
      `SELECT COUNT(*) as count FROM prices
       WHERE ip_hash = ? AND osm_id = ? AND drink = ?
       AND submitted_at >= datetime('now', '-30 days')`
    )
    .get(ipHash, osmId, drink) as { count: number };
  return row.count >= 1;
}

// GET /prices?osm_ids=123,456,789
// Returns the most recent price per drink for each shop
app.get("/prices", (c) => {
  const raw = c.req.query("osm_ids") ?? "";
  const osmIds = raw.split(",").filter(Boolean);

  if (osmIds.length === 0) return c.json([]);

  const placeholders = osmIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT osm_id, name, lat, lon, drink, price_eur, submitted_at
       FROM prices
       WHERE osm_id IN (${placeholders})
       AND (osm_id, drink, submitted_at) IN (
         SELECT osm_id, drink, MAX(submitted_at)
         FROM prices
         WHERE osm_id IN (${placeholders})
         GROUP BY osm_id, drink
       )
       ORDER BY osm_id, drink`
    )
    .all(...osmIds, ...osmIds);

  return c.json(rows);
});

// POST /prices
// Body: { osm_id, name, lat, lon, drink, price_eur }
app.post("/prices", async (c) => {
  const ip = c.req.header("x-forwarded-for") ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");

  if (isRateLimited(ipHash)) {
    return c.json({ error: "Rate limit exceeded" }, 429);
  }

  const body = await c.req.json();
  const { osm_id, name, lat, lon, drink, price_eur } = body;

  if (!DRINK_TYPES.includes(drink)) {
    return c.json({ error: "Invalid drink type" }, 400);
  }
  if (typeof price_eur !== "number" || price_eur < 0.5 || price_eur > 15) {
    return c.json({ error: "Price out of plausible range" }, 400);
  }

  if (isDuplicateSubmission(ipHash, osm_id, drink)) {
    return c.json({ error: "Already submitted this drink for this shop recently" }, 429);
  }

  db.prepare(
    `INSERT INTO prices (osm_id, name, lat, lon, drink, price_eur, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(osm_id, name, lat, lon, drink, price_eur, ipHash);

  return c.json({ ok: true }, 201);
});

// Serve built frontend (production only — in dev, Vite handles this)
app.use("/*", serveStatic({ root: "./app/dist" }));

// SPA fallback: all unmatched routes serve index.html
app.get("/*", serveStatic({ path: "./app/dist/index.html" }));

serve({ fetch: app.fetch, port: 3001, hostname: "0.0.0.0" }, () => {
  console.log("API running on http://localhost:3001");
});

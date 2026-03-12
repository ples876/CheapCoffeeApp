import type { OsmShop, PriceEntry } from "./types";

const OVERPASS = "https://overpass-api.de/api/interpreter";

// Fetch nearby cafes from OpenStreetMap within ~1km radius
export async function fetchNearbyCafes(
  lat: number,
  lon: number
): Promise<OsmShop[]> {
  const radius = 1000; // metres
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="cafe"](around:${radius},${lat},${lon});
      node["shop"="coffee"](around:${radius},${lat},${lon});
      node["shop"="bakery"](around:${radius},${lat},${lon});
      node["amenity"="bakery"](around:${radius},${lat},${lon});
    );
    out body;
  `;

  const res = await fetch(OVERPASS, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = await res.json();
  return data.elements
    .filter((el: any) => el.tags?.name)
    .map((el: any) => ({
      osm_id: String(el.id),
      name: el.tags.name,
      lat: el.lat,
      lon: el.lon,
    }));
}

export async function fetchPrices(osmIds: string[]): Promise<PriceEntry[]> {
  if (osmIds.length === 0) return [];
  const res = await fetch(`/prices?osm_ids=${osmIds.join(",")}`);
  return res.json();
}

export async function submitPrice(payload: {
  osm_id: string;
  name: string;
  lat: number;
  lon: number;
  drink: string;
  price_eur: number;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/prices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

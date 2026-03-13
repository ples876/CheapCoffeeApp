export type DrinkType = "schwarzer" | "cappuccino" | "espresso";

export const DRINK_LABELS: Record<DrinkType, string> = {
  schwarzer: "Schwarzer",
  cappuccino: "Cappuccino",
  espresso: "Espresso",
};

export interface OsmShop {
  osm_id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface PriceEntry {
  osm_id: string;
  drink: DrinkType;
  price_eur: number;
  submitted_at: string;
}

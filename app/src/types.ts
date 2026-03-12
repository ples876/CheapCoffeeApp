export type DrinkType =
  | "schwarzer_klein"
  | "schwarzer_gross"
  | "cappuccino_klein"
  | "cappuccino_gross"
  | "espresso_einfach"
  | "espresso_doppelt";

export const DRINK_LABELS: Record<DrinkType, string> = {
  schwarzer_klein: "Schwarzer (klein)",
  schwarzer_gross: "Schwarzer (groß)",
  cappuccino_klein: "Cappuccino (klein)",
  cappuccino_gross: "Cappuccino (groß)",
  espresso_einfach: "Espresso (einfach)",
  espresso_doppelt: "Espresso (doppelt)",
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

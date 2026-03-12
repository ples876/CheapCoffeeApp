import type { OsmShop, PriceEntry, DrinkType } from "../types";
import { DRINK_LABELS } from "../types";

interface Props {
  shops: OsmShop[];
  prices: PriceEntry[];
  onSelectShop: (shop: OsmShop) => void;
}

function cheapestPrice(osmId: string, prices: PriceEntry[]): number | null {
  const shopPrices = prices
    .filter((p) => p.osm_id === osmId)
    .map((p) => p.price_eur);
  return shopPrices.length > 0 ? Math.min(...shopPrices) : null;
}

function pricesForShop(
  osmId: string,
  prices: PriceEntry[]
): Partial<Record<DrinkType, number>> {
  return Object.fromEntries(
    prices.filter((p) => p.osm_id === osmId).map((p) => [p.drink, p.price_eur])
  );
}

export default function ShopList({ shops, prices, onSelectShop }: Props) {
  const sorted = [...shops].sort((a, b) => {
    const pa = cheapestPrice(a.osm_id, prices) ?? Infinity;
    const pb = cheapestPrice(b.osm_id, prices) ?? Infinity;
    return pa - pb;
  });

  return (
    <ul className="shop-list">
      {sorted.map((shop) => {
        const shopPrices = pricesForShop(shop.osm_id, prices);
        const hasPrices = Object.keys(shopPrices).length > 0;
        return (
          <li key={shop.osm_id} className="shop-card">
            <div className="shop-header">
              <strong>{shop.name}</strong>
              <button onClick={() => onSelectShop(shop)}>Preis eintragen</button>
            </div>
            {hasPrices ? (
              <ul className="price-list">
                {(Object.entries(shopPrices) as [DrinkType, number][]).map(
                  ([drink, price]) => (
                    <li key={drink}>
                      {DRINK_LABELS[drink]}: {price.toFixed(2)} €
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="no-prices">Noch keine Preise eingetragen</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

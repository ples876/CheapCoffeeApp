import { useState } from "react";
import { submitPrice } from "../api";
import type { OsmShop, DrinkType, PriceEntry } from "../types";

interface Props {
  shop: OsmShop;
  prices: PriceEntry[];
  onClose: () => void;
  onSubmitted: () => void;
}

const DRINKS: { drink: DrinkType; label: string }[] = [
  { drink: "schwarzer", label: "Schwarzer" },
  { drink: "cappuccino", label: "Cappuccino" },
  { drink: "espresso", label: "Espresso" },
];

export default function PriceForm({ shop, prices, onClose, onSubmitted }: Props) {
  const [selectedDrink, setSelectedDrink] = useState<{ drink: DrinkType; label: string } | null>(null);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function currentPrice(drink: DrinkType): string {
    const entry = prices.find((p) => p.osm_id === shop.osm_id && p.drink === drink);
    return entry ? `${entry.price_eur.toFixed(2)} €` : "–";
  }

  function openForm(drink: DrinkType, label: string) {
    const entry = prices.find((p) => p.osm_id === shop.osm_id && p.drink === drink);
    setPrice(entry ? entry.price_eur.toFixed(2).replace(".", ",") : "");
    setSelectedDrink({ drink, label });
    setStatus("idle");
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDrink) return;
    const parsed = parseFloat(price.replace(",", "."));
    if (isNaN(parsed)) return;

    setStatus("submitting");
    const result = await submitPrice({
      osm_id: shop.osm_id,
      name: shop.name,
      lat: shop.lat,
      lon: shop.lon,
      drink: selectedDrink.drink,
      price_eur: parsed,
    });

    if (result.ok) {
      setStatus("done");
      onSubmitted();
      setTimeout(() => setSelectedDrink(null), 800);
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Fehler beim Speichern.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {selectedDrink ? (
          <>
            <h2>{shop.name} · {selectedDrink.label}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Preis (€)
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="2,50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  autoFocus
                  required
                />
              </label>
              {status === "error" && <p className="error">{errorMsg}</p>}
              {status === "done" && <p className="success">Gespeichert!</p>}
              <div className="form-actions">
                <button type="button" onClick={() => setSelectedDrink(null)}>← Zurück</button>
                <button type="submit" disabled={status === "submitting"}>
                  {status === "submitting" ? "…" : "Speichern"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2>{shop.name}</h2>
            <div className="price-grid">
              {DRINKS.map(({ drink, label }) => (
                <button
                  key={drink}
                  className="price-btn"
                  onClick={() => openForm(drink, label)}
                >
                  <span className="price-btn-size">{label}</span>
                  <span className="price-btn-value">{currentPrice(drink)}</span>
                </button>
              ))}
            </div>
            <div className="form-actions" style={{ marginTop: "1rem" }}>
              <button type="button" onClick={onClose}>Schließen</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

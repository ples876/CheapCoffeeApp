import { useState } from "react";
import { submitPrice } from "../api";
import type { OsmShop, DrinkType } from "../types";
import { DRINK_LABELS } from "../types";

interface Props {
  shop: OsmShop;
  onClose: () => void;
  onSubmitted: () => void;
}

const DRINKS = Object.keys(DRINK_LABELS) as DrinkType[];

export default function PriceForm({ shop, onClose, onSubmitted }: Props) {
  const [drink, setDrink] = useState<DrinkType>("espresso_einfach");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(price.replace(",", "."));
    if (isNaN(parsed)) return;

    setStatus("submitting");
    const result = await submitPrice({
      osm_id: shop.osm_id,
      name: shop.name,
      lat: shop.lat,
      lon: shop.lon,
      drink,
      price_eur: parsed,
    });

    if (result.ok) {
      setStatus("done");
      onSubmitted();
      setTimeout(onClose, 800);
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Fehler beim Speichern.");
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{shop.name}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Getränk
            <select value={drink} onChange={(e) => setDrink(e.target.value as DrinkType)}>
              {DRINKS.map((d) => (
                <option key={d} value={d}>{DRINK_LABELS[d]}</option>
              ))}
            </select>
          </label>
          <label>
            Preis (€)
            <input
              type="text"
              inputMode="decimal"
              placeholder="2,50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          {status === "error" && <p className="error">{errorMsg}</p>}
          {status === "done" && <p className="success">Gespeichert!</p>}
          <div className="form-actions">
            <button type="button" onClick={onClose}>Abbrechen</button>
            <button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "…" : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

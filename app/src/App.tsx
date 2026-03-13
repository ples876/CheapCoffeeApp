import { useEffect, useState } from "react";
import { fetchNearbyCafes, fetchPrices } from "./api";
import type { OsmShop, PriceEntry } from "./types";
import MapView from "./components/MapView";
import PriceForm from "./components/PriceForm";
import "./App.css";

export default function App() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [shops, setShops] = useState<OsmShop[]>([]);
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [selectedShop, setSelectedShop] = useState<OsmShop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  function locate() {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocation(loc);
        try {
          const found = await fetchNearbyCafes(loc.lat, loc.lon);
          const priceData = await fetchPrices(found.map((s) => s.osm_id));
          setShops(found);
          setPrices(priceData);
        } catch {
          setError("Cafés konnten nicht geladen werden.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === 1)
          setError("Standortzugriff verweigert. Bitte in den Browser-Einstellungen erlauben und Seite neu laden.");
        else
          setError("Standort nicht verfügbar. Bitte GPS aktivieren und Seite neu laden.");
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  }

  useEffect(() => { locate(); }, []);

  function handlePriceSubmitted() {
    if (!shops.length) return;
    fetchPrices(shops.map((s) => s.osm_id)).then(setPrices);
  }

  if (error && !location) return <p className="status">{error}</p>;
  if (!location) return <p className="status">Lade…</p>;

  return (
    <div className="map-container">
      <MapView
        location={location}
        shops={shops}
        prices={prices}
        onSelectShop={setSelectedShop}
      />
      <button className="refresh-btn" onClick={locate} disabled={loading} title="Standort aktualisieren">
        {loading ? "…" : "↺"}
      </button>
      <button className="help-btn" onClick={() => setShowHelp(true)} title="Hilfe">?</button>
      {error && <div className="map-error">{error}</div>}
      {showHelp && (
        <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Was ist CheapCoffee?</h2>
            <p>CheapCoffee zeigt dir, wo du in der Nähe günstig Kaffee bekommst – crowdgesourct von Leuten wie dir.</p>
            <p>Die Pins auf der Karte sind farbkodiert:</p>
            <ul>
              <li><span className="legend-dot legend-green" /> unter 2,50 € – günstig</li>
              <li><span className="legend-dot legend-yellow" /> 2,50–3,50 € – okay</li>
              <li><span className="legend-dot legend-red" /> über 3,50 € – teuer</li>
              <li><span className="legend-dot legend-gray" /> noch kein Preis</li>
            </ul>
            <p>Tippe auf einen Pin oder das Label, um Preise für Schwarzen, Cappuccino oder Espresso einzutragen oder zu aktualisieren.</p>
            <div className="form-actions" style={{ marginTop: "1rem" }}>
              <button type="button" onClick={() => setShowHelp(false)}>Schließen</button>
            </div>
          </div>
        </div>
      )}
      {selectedShop && (
        <PriceForm
          shop={selectedShop}
          prices={prices}
          onClose={() => setSelectedShop(null)}
          onSubmitted={handlePriceSubmitted}
        />
      )}
    </div>
  );
}

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

  function locate() {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setLocation(loc);
        try {
          const found = await fetchNearbyCafes(loc.lat, loc.lon);
          setShops(found);
          const priceData = await fetchPrices(found.map((s) => s.osm_id));
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
      {error && <div className="map-error">{error}</div>}
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

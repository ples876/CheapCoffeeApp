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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError("Standort konnte nicht ermittelt werden.")
    );
  }, []);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    fetchNearbyCafes(location.lat, location.lon)
      .then(async (found) => {
        setShops(found);
        const priceData = await fetchPrices(found.map((s) => s.osm_id));
        setPrices(priceData);
      })
      .catch(() => setError("Cafés konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, [location]);

  function handlePriceSubmitted() {
    if (!shops.length) return;
    fetchPrices(shops.map((s) => s.osm_id)).then(setPrices);
  }

  if (error) return <p className="status">{error}</p>;
  if (!location || loading) return <p className="status">Lade…</p>;

  return (
    <div className="map-container">
      <MapView
        location={location}
        shops={shops}
        prices={prices}
        onSelectShop={setSelectedShop}
      />
      {selectedShop && (
        <PriceForm
          shop={selectedShop}
          onClose={() => setSelectedShop(null)}
          onSubmitted={handlePriceSubmitted}
        />
      )}
    </div>
  );
}

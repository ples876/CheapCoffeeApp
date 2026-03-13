import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { OsmShop, PriceEntry } from "../types";

interface Props {
  location: { lat: number; lon: number };
  shops: OsmShop[];
  prices: PriceEntry[];
  onSelectShop: (shop: OsmShop) => void;
}

function cheapestPrice(osmId: string, prices: PriceEntry[]): number | null {
  const vals = prices.filter((p) => p.osm_id === osmId).map((p) => p.price_eur);
  return vals.length > 0 ? Math.min(...vals) : null;
}

function markerColor(price: number | null): string {
  if (price === null) return "#888";
  if (price < 2.5) return "#2ecc71";
  if (price < 3.5) return "#f1c40f";
  return "#e74c3c";
}

export default function MapView({ location, shops, prices, onSelectShop }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const userDotRef = useRef<L.CircleMarker | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView(
      [location.lat, location.lon],
      16
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);

    userDotRef.current = L.circleMarker([location.lat, location.lon], {
      radius: 8,
      color: "#2980b9",
      fillColor: "#3498db",
      fillOpacity: 1,
      weight: 2,
    })
      .addTo(mapRef.current)
      .bindTooltip("Du bist hier", { permanent: false });
  }, []);

  // Pan map and move user dot when location updates
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.panTo([location.lat, location.lon]);
    userDotRef.current?.setLatLng([location.lat, location.lon]);
  }, [location]);

  // Update shop markers whenever shops or prices change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const shop of shops) {
      const price = cheapestPrice(shop.osm_id, prices);
      const color = markerColor(price);
      const label = price != null ? `ab ${price.toFixed(2)} €` : "Kein Preis";

      const marker = L.circleMarker([shop.lat, shop.lon], {
        radius: 10,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2,
      })
        .addTo(map)
        .bindTooltip(`<strong>${shop.name}</strong><br>${label}`, {
          permanent: false,
          direction: "top",
        })
        .on("click", () => onSelectShop(shop));

      markersRef.current.push(marker);
    }
  }, [shops, prices, onSelectShop]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Default Leaflet marker icons reference files that don't bundle correctly
// under Next.js; point them at a CDN instead of shipping broken markers.
const busIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

export function MapView({
  center,
  busPosition,
  stops = [],
  zoom = 13,
}: {
  center: [number, number];
  busPosition?: [number, number];
  stops?: MapPoint[];
  zoom?: number;
}) {
  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full rounded-lg" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={tileUrl}
      />
      {busPosition && (
        <Marker position={busPosition} icon={busIcon}>
          <Popup>Bus is here</Popup>
        </Marker>
      )}
      {stops.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={busIcon}>
          <Popup>{s.label}</Popup>
        </Marker>
      ))}
      {stops.length > 1 && (
        <Polyline positions={stops.map((s) => [s.lat, s.lng])} pathOptions={{ color: "#0F5C4F" }} />
      )}
    </MapContainer>
  );
}

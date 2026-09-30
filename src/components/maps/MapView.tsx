"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Create custom colored Leaflet DivIcons to avoid image asset bundle issues in Next.js
export function createCustomIcon(color: string = "#0F5C4F", text?: string | number) {
  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="
        background: ${color};
        color: white;
        border-radius: 9999px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 11px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2.5px solid white;
        transform: translate(-50%, -50%);
      ">
        ${text !== undefined ? text : "•"}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const busIcon = L.divIcon({
  className: "custom-bus-marker",
  html: `
    <div style="
      background: #10B981;
      color: white;
      border-radius: 9999px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 14px;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5);
      border: 3px solid white;
      animation: pulse 2s infinite;
      transform: translate(-50%, -50%);
    ">
      🚌
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `
    <div style="
      background: #2563EB;
      color: white;
      border-radius: 9999px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.25);
      border: 2.5px solid white;
      transform: translate(-50%, -50%);
    ">
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sequence?: number;
  details?: string;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

export function MapView({
  center,
  busPosition,
  userPosition,
  stops = [],
  selectedPosition,
  radiusMeters,
  zoom = 13,
  onMapClick,
  onStopClick,
}: {
  center: [number, number];
  busPosition?: [number, number];
  userPosition?: [number, number];
  stops?: MapPoint[];
  selectedPosition?: [number, number];
  radiusMeters?: number;
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onStopClick?: (stop: MapPoint) => void;
}) {
  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full rounded-xl"
      scrollWheelZoom
    >
      <RecenterMap center={center} zoom={zoom} />
      <MapClickHandler onMapClick={onMapClick} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={tileUrl}
      />

      {/* Radius circle around user position if specified */}
      {userPosition && radiusMeters && (
        <Circle
          center={userPosition}
          radius={radiusMeters}
          pathOptions={{ color: "#2563EB", fillColor: "#3B82F6", fillOpacity: 0.12, weight: 1.5 }}
        />
      )}

      {/* User Position Marker */}
      {userPosition && (
        <Marker position={userPosition} icon={userIcon}>
          <Popup>
            <div className="font-semibold text-xs text-blue-600">You are here</div>
          </Popup>
        </Marker>
      )}

      {/* Live Bus Position Marker */}
      {busPosition && (
        <Marker position={busPosition} icon={busIcon}>
          <Popup>
            <div className="font-bold text-xs text-emerald-800">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Bus is live here
              </span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Clicked / Selected Target Marker */}
      {selectedPosition && (
        <Marker position={selectedPosition} icon={createCustomIcon("#F59E0B", "📍")}>
          <Popup>
            <div className="font-semibold text-xs text-amber-800">Selected Location</div>
            <div className="text-[10px] text-gray-500">{selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}</div>
          </Popup>
        </Marker>
      )}

      {/* Stops Markers */}
      {stops.map((s, idx) => {
        const markerIcon = createCustomIcon(
          "#0F5C4F",
          s.sequence !== undefined ? s.sequence : idx + 1
        );

        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={markerIcon}
            eventHandlers={{
              click: () => onStopClick?.(s),
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-bold text-gray-900">{s.label}</div>
                {s.sequence !== undefined && (
                  <div className="text-[11px] font-semibold text-emerald-700">Stop #{s.sequence}</div>
                )}
                {s.details && (
                  <div className="text-[10px] text-gray-600 mt-1">{s.details}</div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Route Polyline connecting stops */}
      {stops.length > 1 && (
        <Polyline
          positions={stops.map((s) => [s.lat, s.lng])}
          pathOptions={{ color: "#0F5C4F", weight: 4, opacity: 0.8, dashArray: "6, 8" }}
        />
      )}
    </MapContainer>
  );
}

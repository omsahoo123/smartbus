"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import type { MapPoint } from "@/components/maps/MapView";
import { MapPin, Navigation, Compass, AlertCircle, RefreshCw } from "lucide-react";

const MapView = dynamic(
  () => import("@/components/maps/MapView").then((m) => m.MapView),
  { ssr: false }
);

interface StopWithDistance {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

const RADIUS_KM = 3; // 3km radius for city transit search

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyStopsPage() {
  const supabase = createClient();
  const [stops, setStops] = useState<StopWithDistance[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "denied" | "ready">("idle");
  const [selectedStop, setSelectedStop] = useState<StopWithDistance | null>(null);

  function findNearby() {
    setStatus("locating");
    if (!navigator.geolocation) {
      fallbackToDefault();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserPos([uLat, uLng]);
        await loadStopsForCoords(uLat, uLng);
      },
      () => {
        fallbackToDefault();
      },
      { timeout: 8000 }
    );
  }

  async function fallbackToDefault() {
    // Default to city center (Bhubaneswar Master Canteen area)
    const defaultLat = 20.2706;
    const defaultLng = 85.8334;
    setUserPos([defaultLat, defaultLng]);
    await loadStopsForCoords(defaultLat, defaultLng);
    setStatus("ready");
  }

  async function loadStopsForCoords(lat: number, lng: number) {
    const { data } = await supabase.from("stops").select("*");
    const withDistance = (data ?? [])
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        distanceKm: haversineKm(lat, lng, s.latitude, s.longitude),
      }))
      .filter((s) => s.distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    setStops(withDistance);
    if (withDistance.length > 0) {
      setSelectedStop(withDistance[0]);
    }
    setStatus("ready");
  }

  useEffect(() => {
    findNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapPoints: MapPoint[] = stops.map((s, idx) => ({
    id: s.id,
    lat: s.latitude,
    lng: s.longitude,
    label: s.name,
    sequence: idx + 1,
    details: `${s.distanceKm.toFixed(2)} km away • ${s.address || ""}`,
  }));

  const centerPos = userPos ?? [20.2706, 85.8334];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Nearby Bus Stops</h1>
          <p className="text-xs text-muted">
            Locate boarding points and stoppages within walking and transit distance ({RADIUS_KM} km).
          </p>
        </div>
        <button
          type="button"
          onClick={findNearby}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-bg transition shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-primary ${status === "locating" ? "animate-spin" : ""}`} />
          <span>Refresh Location</span>
        </button>
      </div>

      {status === "denied" && (
        <Card className="border-dashed p-4 text-center text-xs text-muted flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>
            Location access was not granted; showing city center transit hub stops.
          </span>
        </Card>
      )}

      {/* Map View of Nearby Stops */}
      <Card className="p-4 bg-surface shadow-sm overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <Compass className="h-4 w-4 text-primary" />
            <span>Interactive Stops Radar</span>
          </div>
          <span className="text-[11px] text-muted">
            Blue marker: Your position • Green: Bus stops
          </span>
        </div>

        <div className="h-72 sm:h-80 w-full overflow-hidden rounded-xl border border-line">
          <MapView
            center={centerPos}
            userPosition={userPos ?? undefined}
            radiusMeters={RADIUS_KM * 1000}
            stops={mapPoints}
            zoom={14}
            onStopClick={(p) => {
              const matched = stops.find((s) => s.id === p.id);
              if (matched) setSelectedStop(matched);
            }}
          />
        </div>
      </Card>

      {/* Selected Stop Card */}
      {selectedStop && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{selectedStop.name}</p>
                <p className="text-xs text-muted">{selectedStop.address || "Main corridor stop"}</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary font-mono">
              {selectedStop.distanceKm.toFixed(2)} km away
            </span>
          </div>
        </Card>
      )}

      {/* Stops List */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-bold text-ink">
          Stops Near You ({stops.length})
        </h2>

        {status === "locating" && (
          <div className="space-y-2">
            <div className="skeleton h-16 w-full rounded-xl" />
            <div className="skeleton h-16 w-full rounded-xl" />
          </div>
        )}

        {status === "ready" && stops.length === 0 && (
          <Card className="border-dashed p-8 text-center text-xs text-muted">
            No bus stops found within {RADIUS_KM} km of your current location.
          </Card>
        )}

        {stops.map((s, idx) => (
          <Card
            key={s.id}
            onClick={() => setSelectedStop(s)}
            className={`flex items-center justify-between p-4 cursor-pointer transition hover:border-primary/50 ${
              selectedStop?.id === s.id ? "ring-2 ring-primary/40 border-primary" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg font-mono text-xs font-bold text-muted border border-line">
                {idx + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{s.name}</p>
                <p className="text-xs text-muted">{s.address || "Transit stoppage"}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-ink">
                {s.distanceKm < 1
                  ? `${Math.round(s.distanceKm * 1000)} m`
                  : `${s.distanceKm.toFixed(1)} km`}
              </span>
              <p className="text-[10px] text-muted">approx. walk</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";

interface StopWithDistance {
  id: string;
  name: string;
  address: string | null;
  distanceKm: number;
}

const RADIUS_KM = 2; // configurable; spec suggests ~500m default but a wider
// demo radius surfaces more of the seeded stops.

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
  const [status, setStatus] = useState<"idle" | "locating" | "denied" | "ready">("idle");

  function findNearby() {
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { data } = await supabase.from("stops").select("*");
        const withDistance = (data ?? [])
          .map((s: any) => ({
            id: s.id,
            name: s.name,
            address: s.address,
            distanceKm: haversineKm(pos.coords.latitude, pos.coords.longitude, s.latitude, s.longitude),
          }))
          .filter((s) => s.distanceKm <= RADIUS_KM)
          .sort((a, b) => a.distanceKm - b.distanceKm);
        setStops(withDistance);
        setStatus("ready");
      },
      () => setStatus("denied")
    );
  }

  useEffect(() => {
    findNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Nearby stops</h1>

      {status === "denied" && (
        <Card className="border-dashed text-center text-sm text-muted">
          Location access was denied. Enable it in your browser settings to see stops near you.
        </Card>
      )}
      {status === "locating" && <div className="skeleton h-24 w-full rounded-lg" />}

      {status === "ready" && stops.length === 0 && (
        <Card className="border-dashed text-center text-sm text-muted">
          No stops within {RADIUS_KM}km. Try a different location.
        </Card>
      )}

      <div className="space-y-3">
        {stops.map((s) => (
          <Card key={s.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{s.name}</p>
              <p className="text-xs text-muted">{s.address}</p>
            </div>
            <span className="text-xs text-muted">{s.distanceKm.toFixed(1)} km</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { getLatestLocation, subscribeToTripLocation } from "@/services/tracking";

// react-leaflet touches window at import time, so it must be loaded client-only.
const MapView = dynamic(() => import("@/components/maps/MapView").then((m) => m.MapView), { ssr: false });

export default function TrackingPage() {
  const supabase = createClient();
  const [tripId, setTripId] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data: booking } = await supabase
        .from("bookings")
        .select("trip_id")
        .eq("user_id", user.id)
        .eq("booking_status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!booking) return;
      setTripId(booking.trip_id);

      const latest = await getLatestLocation(supabase, booking.trip_id);
      if (latest) {
        setPosition([latest.latitude, latest.longitude]);
        setLastUpdate(latest.recorded_at);
      }

      subscribeToTripLocation(supabase, booking.trip_id, (payload) => {
        const loc = payload.new;
        setPosition([loc.latitude, loc.longitude]);
        setLastUpdate(loc.recorded_at);
      });
    }
    init();
  }, [supabase]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Live tracking</h1>

      {!tripId && (
        <Card className="border-dashed text-center text-sm text-muted">
          You don&apos;t have an active confirmed trip to track right now.
        </Card>
      )}

      {tripId && (
        <>
          <div className="h-[420px] overflow-hidden rounded-lg border border-line">
            <MapView center={position ?? [20.27, 85.84]} busPosition={position ?? undefined} />
          </div>
          <p className="text-xs text-muted">
            {lastUpdate ? `Last updated ${new Date(lastUpdate).toLocaleTimeString()}` : "Waiting for the driver to start sharing location..."}
          </p>
        </>
      )}
    </div>
  );
}

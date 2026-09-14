"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { sendLocationUpdate } from "@/services/tracking";

const MapView = dynamic(() => import("@/components/maps/MapView").then((m) => m.MapView), { ssr: false });

export default function ActiveTripPage({ params }: { params: { id: string } }) {
  const tripId = params.id;
  const supabase = createClient();

  const [trip, setTrip] = useState<any>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("trips")
        .select("id, status, bus_id, route:routes ( route_name, source, destination )")
        .eq("id", tripId)
        .single();
      setTrip(data);
    }
    load();
  }, [tripId, supabase]);

  async function updateStatus(status: "running" | "completed") {
    const patch: any = { status };
    if (status === "running") patch.start_time = new Date().toISOString();
    if (status === "completed") patch.end_time = new Date().toISOString();

    const { error: updateError } = await supabase.from("trips").update(patch).eq("id", tripId);
    if (updateError) return setError(updateError.message);
    setTrip((t: any) => ({ ...t, status }));
    if (status === "completed") stopSharing();
  }

  function startSharing() {
    if (!("geolocation" in navigator)) return setError("Geolocation is not supported on this device.");
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        setPosition([latitude, longitude]);
        try {
          await sendLocationUpdate(supabase, {
            tripId,
            busId: trip.bus_id,
            latitude,
            longitude,
            speed: speed ?? undefined,
          });
        } catch (err: any) {
          setError(err.message);
        }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stopSharing() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setSharing(false);
  }

  useEffect(() => () => stopSharing(), []);

  if (!trip) return <div className="skeleton h-64 w-full rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">{trip.route?.route_name}</h1>
          <p className="text-sm text-muted">{trip.route?.source} &rarr; {trip.route?.destination}</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <div className="flex flex-wrap gap-3">
        {trip.status === "scheduled" && <Button onClick={() => updateStatus("running")}>Start trip</Button>}
        {trip.status === "running" && !sharing && <Button onClick={startSharing}>Start sharing GPS</Button>}
        {trip.status === "running" && sharing && <Button variant="secondary" onClick={stopSharing}>Pause GPS</Button>}
        {trip.status === "running" && <Button variant="danger" onClick={() => updateStatus("completed")}>End trip</Button>}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="h-[380px] overflow-hidden rounded-lg border border-line">
        <MapView center={position ?? [20.27, 85.84]} busPosition={position ?? undefined} />
      </div>

      <Card>
        <p className="text-sm font-medium text-ink">Emergency / breakdown</p>
        <p className="text-xs text-muted">Report a breakdown or emergency for this trip.</p>
        <Button
          variant="danger"
          className="mt-3"
          onClick={async () => {
            await supabase.from("maintenance").insert({
              bus_id: trip.bus_id,
              issue: "Driver-reported emergency during trip " + tripId,
              status: "open",
            });
            alert("Reported to admin.");
          }}
        >
          Report emergency
        </Button>
      </Card>
    </div>
  );
}

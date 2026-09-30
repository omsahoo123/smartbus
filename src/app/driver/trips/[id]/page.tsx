"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { sendLocationUpdate } from "@/services/tracking";
import type { MapPoint } from "@/components/maps/MapView";
import {
  Users,
  Navigation,
  Radio,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ShieldAlert,
} from "lucide-react";

const MapView = dynamic(
  () => import("@/components/maps/MapView").then((m) => m.MapView),
  { ssr: false }
);

export default function ActiveTripPage({ params }: { params: { id: string } }) {
  const tripId = params.id;
  const supabase = createClient();

  const [trip, setTrip] = useState<any>(null);
  const [routeStops, setRouteStops] = useState<MapPoint[]>([]);
  const [passengerCount, setPassengerCount] = useState<number>(0);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyReported, setEmergencyReported] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("trips")
        .select(
          `id, status, bus_id, route_id,
           bus:buses ( bus_number, capacity ),
           route:routes ( id, route_name, source, destination )`
        )
        .eq("id", tripId)
        .single();

      if (!data) return;
      setTrip(data);

      // Load route stops for map
      const { data: stops } = await supabase
        .from("route_stops")
        .select(`id, sequence, arrival_time, departure_time, stop:stops ( id, name, latitude, longitude, address )`)
        .eq("route_id", data.route_id)
        .order("sequence", { ascending: true });

      const points: MapPoint[] = (stops ?? [])
        .filter((s: any) => s.stop?.latitude && s.stop?.longitude)
        .map((s: any, idx: number) => ({
          id: s.id,
          lat: s.stop.latitude,
          lng: s.stop.longitude,
          label: s.stop.name,
          sequence: idx + 1,
          details: s.arrival_time ? `Arr: ${s.arrival_time.slice(0, 5)}` : s.stop.address,
        }));

      setRouteStops(points);

      // Load confirmed passenger count
      const { count } = await supabase
        .from("booking_passengers")
        .select("id, booking:bookings!inner(trip_id, booking_status)", { count: "exact", head: true })
        .eq("booking.trip_id", tripId)
        .eq("booking.booking_status", "confirmed");

      setPassengerCount(count ?? 0);
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

  if (!trip) return <div className="skeleton h-64 w-full rounded-2xl" />;

  const centerPos = position ?? (routeStops.length > 0 ? [routeStops[0].lat, routeStops[0].lng] : [20.27, 85.84]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Trip Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold bg-bg px-2 py-0.5 rounded border border-line">
              {trip.bus?.bus_number}
            </span>
            <span className="text-xs text-muted">Active Duty Trip</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">{trip.route?.route_name}</h1>
          <p className="text-xs text-muted">{trip.route?.source} &rarr; {trip.route?.destination}</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      {/* Driver HUD Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl bg-surface p-3.5 border border-line shadow-sm">
          <span className="text-muted block text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Onboard Passengers</span>
          </span>
          <span className="font-display text-xl font-extrabold text-ink mt-1 block">
            {passengerCount} <span className="text-xs font-normal text-muted">/ {trip.bus?.capacity ?? 40}</span>
          </span>
        </div>

        <div className="rounded-xl bg-surface p-3.5 border border-line shadow-sm">
          <span className="text-muted block text-[11px] uppercase tracking-wider flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>Route Stoppages</span>
          </span>
          <span className="font-display text-xl font-extrabold text-ink mt-1 block">
            {routeStops.length} stops
          </span>
        </div>

        <div className="rounded-xl bg-surface p-3.5 border border-line shadow-sm">
          <span className="text-muted block text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Radio className="h-3.5 w-3.5 text-emerald-600" />
            <span>GPS Broadcast</span>
          </span>
          <span className="font-bold text-sm text-ink mt-1 block flex items-center gap-1.5">
            {sharing ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-700">Broadcasting Live</span>
              </>
            ) : (
              <span className="text-muted">Idle</span>
            )}
          </span>
        </div>

        <div className="rounded-xl bg-surface p-3.5 border border-line shadow-sm">
          <span className="text-muted block text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Trip Status</span>
          </span>
          <span className="font-bold text-sm text-ink mt-1 block uppercase font-mono">
            {trip.status}
          </span>
        </div>
      </div>

      {/* Driver Controls */}
      <div className="flex flex-wrap gap-3">
        {trip.status === "scheduled" && (
          <Button onClick={() => updateStatus("running")} className="text-xs font-bold">
            Start Trip
          </Button>
        )}
        {trip.status === "running" && !sharing && (
          <Button onClick={startSharing} className="text-xs font-bold">
            Start Sharing GPS Telemetry
          </Button>
        )}
        {trip.status === "running" && sharing && (
          <Button variant="secondary" onClick={stopSharing} className="text-xs">
            Pause GPS Broadcast
          </Button>
        )}
        {trip.status === "running" && (
          <Button variant="danger" onClick={() => updateStatus("completed")} className="text-xs">
            Complete & End Trip
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 p-3 text-xs text-danger flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Route & Stoppages Map */}
      <Card className="p-4 bg-surface shadow-sm overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-display text-sm font-bold text-ink">Corridor & Live Vehicle Position</span>
          <span className="text-[11px] text-muted">Green markers: Route stoppages in sequence</span>
        </div>
        <div className="h-[400px] overflow-hidden rounded-xl border border-line">
          <MapView
            center={centerPos}
            busPosition={position ?? undefined}
            stops={routeStops}
            zoom={13}
          />
        </div>
      </Card>

      {/* Emergency / Breakdown Reporting */}
      <Card className="p-5 border-danger/30 bg-danger/5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-danger font-bold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <span>Emergency / Vehicle Breakdown Reporting</span>
            </div>
            <p className="mt-1 text-xs text-muted max-w-lg">
              Immediately alerts fleet dispatch, updates maintenance logs, and warns control center.
            </p>
          </div>

          <Button
            variant="danger"
            onClick={async () => {
              try {
                await supabase.from("maintenance").insert({
                  bus_id: trip.bus_id,
                  issue: `Driver reported emergency during trip ${tripId} (${trip.route?.route_name})`,
                  status: "open",
                });
                setEmergencyReported(true);
              } catch (err: any) {
                setError(err.message);
              }
            }}
            disabled={emergencyReported}
            className="text-xs shrink-0"
          >
            {emergencyReported ? "Reported to Dispatch" : "Report Emergency"}
          </Button>
        </div>
        {emergencyReported && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            Emergency ticket dispatched to admin control center.
          </p>
        )}
      </Card>
    </div>
  );
}

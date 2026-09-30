"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { getLatestLocation, subscribeToTripLocation } from "@/services/tracking";
import type { MapPoint } from "@/components/maps/MapView";
import { Radio, Navigation, Clock, MapPin, AlertCircle, Bus } from "lucide-react";

const MapView = dynamic(
  () => import("@/components/maps/MapView").then((m) => m.MapView),
  { ssr: false }
);

export default function TrackingPage() {
  const supabase = createClient();
  const [tripData, setTripData] = useState<any>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [routeStops, setRouteStops] = useState<MapPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      // Find the user's latest confirmed booking
      const { data: booking } = await supabase
        .from("bookings")
        .select(
          `trip_id,
           trip:trips (
             id, status, trip_date, route_id,
             bus:buses ( bus_number, bus_type ),
             route:routes ( id, route_name, source, destination )
           )`
        )
        .eq("user_id", user.id)
        .eq("booking_status", "confirmed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!booking || !booking.trip) {
        setLoading(false);
        return;
      }

      const tripObj = (Array.isArray(booking.trip) ? booking.trip[0] : booking.trip) as any;
      setTripData(tripObj);

      // Fetch route stops for this trip
      const { data: stops } = await supabase
        .from("route_stops")
        .select(`id, sequence, arrival_time, departure_time, stop:stops ( id, name, latitude, longitude, address )`)
        .eq("route_id", tripObj.route_id)
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

      // Fetch latest location
      const latest = await getLatestLocation(supabase, booking.trip_id);
      if (latest) {
        setPosition([latest.latitude, latest.longitude]);
        setLastUpdate(latest.recorded_at);
      } else if (points.length > 0) {
        // Fallback to first stop position
        setPosition([points[0].lat, points[0].lng]);
      }

      // Subscribe to real-time location stream
      subscribeToTripLocation(supabase, booking.trip_id, (payload) => {
        const loc = payload.new;
        if (loc && loc.latitude && loc.longitude) {
          setPosition([loc.latitude, loc.longitude]);
          setLastUpdate(loc.recorded_at);
        }
      });

      setLoading(false);
    }

    init();
  }, [supabase]);

  const centerPos = position ?? (routeStops.length > 0 ? [routeStops[0].lat, routeStops[0].lng] : [20.27, 85.84]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Live Bus Tracking</h1>
          <p className="text-xs text-muted">
            Real-time GPS telemetry and stoppage progress along your booked route.
          </p>
        </div>

        {tripData && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
            <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span>Bus {tripData.bus?.bus_number} • Live Telemetry</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="skeleton h-24 w-full rounded-2xl" />
          <div className="skeleton h-96 w-full rounded-2xl" />
        </div>
      )}

      {!loading && !tripData && (
        <Card className="border-dashed p-8 text-center text-sm text-muted">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted mb-3 border border-line">
            <Bus className="h-6 w-6" />
          </div>
          <p className="font-display font-semibold text-ink">No Active Booking to Track</p>
          <p className="text-xs mt-1">
            You don&apos;t have any confirmed trips in progress. Book a ticket to view live GPS tracking.
          </p>
        </Card>
      )}

      {!loading && tripData && (
        <>
          {/* Trip Info Header */}
          <div className="rounded-2xl bg-surface border border-line p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div>
              <span className="font-mono font-bold text-ink bg-bg px-2 py-0.5 rounded border border-line mr-2">
                {tripData.bus?.bus_number}
              </span>
              <span className="font-bold text-ink">
                {tripData.route?.source} &rarr; {tripData.route?.destination}
              </span>
              <p className="text-[11px] text-muted mt-1">
                Route: {tripData.route?.route_name} • Total Stoppages: {routeStops.length}
              </p>
            </div>

            <div className="flex items-center gap-4 text-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>{lastUpdate ? `Updated: ${new Date(lastUpdate).toLocaleTimeString()}` : "Awaiting first GPS ping..."}</span>
              </span>
            </div>
          </div>

          {/* Interactive Map */}
          <Card className="p-4 bg-surface shadow-sm overflow-hidden">
            <div className="h-[440px] w-full overflow-hidden rounded-xl border border-line">
              <MapView
                center={centerPos}
                busPosition={position ?? undefined}
                stops={routeStops}
                zoom={13}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <strong className="text-ink">Bus Marker:</strong> Live location
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0F5C4F]" />
                  <strong className="text-ink">Green Pins:</strong> Route stops in order
                </span>
              </div>
              <span className="text-[11px] italic">
                Updates stream via Supabase Realtime WebSocket
              </span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

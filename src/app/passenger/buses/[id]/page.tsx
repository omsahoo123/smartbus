"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SeatMap } from "@/components/booking/SeatMap";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { Seat } from "@/types/database";
import {
  Bus,
  ArrowRight,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronLeft,
  Info,
  CheckCircle2,
  MapPin,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const FARE_PER_SEAT = 499;

export default function SeatSelectionPage({ params }: { params: { id: string } }) {
  const tripId = params.id;
  const router = useRouter();
  const supabase = createClient();

  const [trip, setTrip] = useState<any>(null);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [boardingStopId, setBoardingStopId] = useState<string>("");
  const [droppingStopId, setDroppingStopId] = useState<string>("");
  const [allSeats, setAllSeats] = useState<Seat[]>([]);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: tripData } = await supabase
        .from("trips")
        .select(
          `id, trip_date, status, bus_id, route_id,
           bus:buses ( id, bus_number, bus_type, capacity ),
           route:routes ( id, route_name, source, destination ),
           schedule:schedules ( departure_time, arrival_time )`
        )
        .eq("id", tripId)
        .single();

      if (!tripData) {
        setError("Trip not found.");
        setLoading(false);
        return;
      }
      setTrip(tripData);

      // Fetch route stops
      const { data: stops } = await supabase
        .from("route_stops")
        .select(`id, stop_id, sequence, arrival_time, departure_time, stop:stops ( id, name, address )`)
        .eq("route_id", tripData.route_id)
        .order("sequence", { ascending: true });

      const stopsList = (stops ?? []).filter((s) => s.stop);
      setRouteStops(stopsList);

      if (stopsList.length > 0) {
        setBoardingStopId(stopsList[0].stop_id);
        setDroppingStopId(stopsList[stopsList.length - 1].stop_id);
      }

      // Fetch seats & current available seats
      const [seatsRes, availableRes] = await Promise.all([
        supabase.from("seats").select("*").eq("bus_id", tripData.bus_id).order("row_number"),
        supabase.rpc("available_seats_for_trip", { p_trip_id: tripId }),
      ]);

      setAllSeats((seatsRes.data as Seat[]) ?? []);
      const availSet = new Set<string>((availableRes.data ?? []).map((s: any) => s.id));
      setAvailableIds(availSet);
    } catch (err: any) {
      setError(err.message || "Failed to load trip information.");
    } finally {
      setLoading(false);
    }
  }, [tripId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleSeat(seatId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(seatId) ? next.delete(seatId) : next.add(seatId);
      return next;
    });
  }

  async function handleContinue() {
    setError(null);
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return router.push("/login");

    if (selected.size === 0) {
      setSubmitting(false);
      return setError("Please select at least one seat to continue.");
    }

    try {
      const { data: bookingId, error: rpcError } = await supabase.rpc("reserve_seats", {
        p_trip_id: tripId,
        p_user_id: user.id,
        p_seat_ids: Array.from(selected),
        p_boarding_stop_id: boardingStopId || null,
        p_dropping_stop_id: droppingStopId || null,
        p_hold_minutes: 10,
      });

      if (rpcError) {
        // Race condition / dirty read handling:
        // If seat was just reserved by another user concurrently, inform user and refresh available seats
        setError(rpcError.message);

        // Re-fetch available seats immediately
        const { data: latestAvailable } = await supabase.rpc("available_seats_for_trip", { p_trip_id: tripId });
        const freshAvail = new Set<string>((latestAvailable ?? []).map((s: any) => s.id));
        setAvailableIds(freshAvail);

        // Deselect any taken seat
        setSelected((prev) => {
          const updated = new Set<string>();
          prev.forEach((id) => {
            if (freshAvail.has(id)) updated.add(id);
          });
          return updated;
        });

        setSubmitting(false);
        return;
      }

      router.push(`/passenger/booking/${bookingId}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while locking seats.");
      setSubmitting(false);
    }
  }

  const bookedIds = new Set(allSeats.map((s) => s.id).filter((id) => !availableIds.has(id)));

  const busNumber = trip?.bus?.bus_number ?? "OD-02-101";
  const busType = trip?.bus?.bus_type?.replace(/_/g, " ") ?? "AC Seater";
  const source = trip?.route?.source ?? "Bhubaneswar";
  const destination = trip?.route?.destination ?? "Puri";
  const departure = trip?.schedule?.departure_time ?? "08:00 AM";
  const arrival = trip?.schedule?.arrival_time ?? "10:30 AM";
  const date = trip?.trip_date ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TRIP HEADER CARD */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B453B] via-[#0F5C4F] to-[#146B5C] p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 mb-1">
            <Link
              href="/passenger/search"
              className="inline-flex items-center gap-1 hover:underline text-white/80 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Search</span>
            </Link>
            <span className="text-white/40">•</span>
            <span className="font-mono bg-white/15 px-2 py-0.5 rounded text-white font-bold">
              {busNumber}
            </span>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] uppercase font-bold text-emerald-200">
              {busType}
            </span>
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <span>{source}</span>
            <ArrowRight className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{destination}</span>
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-amber-300" />
              <span>{date}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-300" />
              <span>Departure: {departure} &rarr; Arrival: {arrival}</span>
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-white/20 pt-3 sm:pt-0 sm:pl-6">
          <p className="text-[11px] font-semibold text-white/70 uppercase">Ticket Price</p>
          <p className="font-display text-2xl font-black text-amber-300">₹{FARE_PER_SEAT} <span className="text-xs font-medium text-white/80">/ seat</span></p>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 p-3.5 text-xs text-danger flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline ml-2"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh Seats</span>
          </button>
        </div>
      )}

      {/* BOARDING & DROPPING STOP SELECTION */}
      {routeStops.length > 0 && (
        <Card className="p-4 bg-surface shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold text-ink">Choose Boarding & Dropping Stoppages</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Boarding Stoppage"
              value={boardingStopId}
              onChange={(e) => setBoardingStopId(e.target.value)}
            >
              {routeStops.map((rs, idx) => (
                <option key={rs.stop_id} value={rs.stop_id}>
                  Stop #{idx + 1}: {rs.stop?.name} {rs.departure_time ? `(${rs.departure_time.slice(0, 5)})` : ""}
                </option>
              ))}
            </Select>

            <Select
              label="Dropping Stoppage"
              value={droppingStopId}
              onChange={(e) => setDroppingStopId(e.target.value)}
            >
              {routeStops.map((rs, idx) => (
                <option key={rs.stop_id} value={rs.stop_id}>
                  Stop #{idx + 1}: {rs.stop?.name} {rs.arrival_time ? `(${rs.arrival_time.slice(0, 5)})` : ""}
                </option>
              ))}
            </Select>
          </div>
        </Card>
      )}

      {/* MAIN SEAT PICKER GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* SEAT MAP (2 COLS ON DESKTOP) */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="skeleton h-96 w-full rounded-2xl" />
          ) : (
            <Card className="p-6 bg-surface">
              <h2 className="font-display text-lg font-bold text-ink mb-1 text-center">
                Select Your Desired Seat
              </h2>
              <p className="text-xs text-muted text-center mb-6">
                Click on any available white seat to select. Orange represents your selection.
              </p>

              <SeatMap
                seats={allSeats}
                bookedSeatIds={bookedIds}
                selectedSeatIds={selected}
                onToggle={toggleSeat}
              />
            </Card>
          )}
        </div>

        {/* FARE SUMMARY CARD (1 COL) */}
        <div>
          <Card className="sticky top-24 p-6 bg-surface shadow-md">
            <h2 className="font-display text-lg font-bold text-ink">Fare Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div className="flex justify-between items-center">
                <span>Seats Selected</span>
                <span className="font-bold text-ink bg-bg px-2.5 py-0.5 rounded-lg border border-line">
                  {selected.size}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Base Fare (per seat)</span>
                <span className="font-medium text-ink">₹{FARE_PER_SEAT}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>GST & Toll Charges</span>
                <span className="font-medium text-emerald-700">₹0 (Included)</span>
              </div>

              <div className="flex justify-between items-center border-t border-line pt-3 font-display text-base font-extrabold text-ink">
                <span>Total Amount</span>
                <span className="text-xl font-black text-primary">
                  ₹{selected.size * FARE_PER_SEAT}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={selected.size === 0 || submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E9A23B] to-[#F59E0B] py-3 px-4 text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{submitting ? "Reserving atomic lock..." : "Proceed to Passenger Details"}</span>
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-bg p-3 text-xs text-muted border border-line">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Atomic reservation locks your seats for 10 minutes, protecting against dirty reads and concurrent double-booking.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

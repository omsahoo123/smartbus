"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SeatMap } from "@/components/booking/SeatMap";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Seat } from "@/types/database";
import {
  Bus,
  ArrowRight,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronLeft,
  Info,
  CheckCircle2
} from "lucide-react";

const FARE_PER_SEAT = 499;

export default function SeatSelectionPage({ params }: { params: { id: string } }) {
  const tripId = params.id;
  const router = useRouter();
  const supabase = createClient();

  const [trip, setTrip] = useState<any>(null);
  const [allSeats, setAllSeats] = useState<Seat[]>([]);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: tripData } = await supabase
        .from("trips")
        .select(
          `id, trip_date, status, bus_id,
           bus:buses ( id, bus_number, bus_type, capacity ),
           route:routes ( id, route_name, source, destination ),
           schedule:schedules ( departure_time, arrival_time )`
        )
        .eq("id", tripId)
        .single();

      if (!tripData) return setLoading(false);
      setTrip(tripData);

      const { data: seats } = await supabase
        .from("seats")
        .select("*")
        .eq("bus_id", tripData.bus_id)
        .order("row_number");
      const { data: available } = await supabase.rpc("available_seats_for_trip", { p_trip_id: tripId });

      setAllSeats((seats as Seat[]) ?? []);
      setAvailableIds(new Set((available ?? []).map((s: any) => s.id)));
      setLoading(false);
    }
    load();
  }, [tripId, supabase]);

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

    const { data: bookingId, error: rpcError } = await supabase.rpc("reserve_seats", {
      p_trip_id: tripId,
      p_user_id: user.id,
      p_seat_ids: Array.from(selected),
      p_boarding_stop_id: null,
      p_dropping_stop_id: null,
    });

    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/passenger/booking/${bookingId}`);
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
                Click on any available green/white seat to select or deselect.
              </p>

              <SeatMap
                seats={allSeats}
                bookedSeatIds={bookedIds}
                selectedSeatIds={selected}
                onToggle={toggleSeat}
              />
            </Card>
          )}
          {error && (
            <div className="mt-3 rounded-xl bg-danger/10 border border-danger/30 p-3 text-sm text-danger flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
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
              <span>{submitting ? "Reserving..." : "Proceed to Passenger Details"}</span>
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-bg p-3 text-xs text-muted border border-line">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                Atomic reservation locks your seats for 10 minutes while you finalize passenger details and confirm.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

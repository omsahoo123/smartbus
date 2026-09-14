"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SeatMap } from "@/components/booking/SeatMap";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Seat } from "@/types/database";

const FARE_PER_SEAT = 499;

// params.id here is the trip id (see /passenger/search -> BusCard link).
export default function SeatSelectionPage({ params }: { params: { id: string } }) {
  const tripId = params.id;
  const router = useRouter();
  const supabase = createClient();

  const [allSeats, setAllSeats] = useState<Seat[]>([]);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: trip } = await supabase.from("trips").select("bus_id").eq("id", tripId).single();
      if (!trip) return setLoading(false);

      const { data: seats } = await supabase.from("seats").select("*").eq("bus_id", trip.bus_id).order("row_number");
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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return router.push("/login");
    if (selected.size === 0) return setError("Select at least one seat to continue.");

    const { data: bookingId, error: rpcError } = await supabase.rpc("reserve_seats", {
      p_trip_id: tripId,
      p_user_id: user.id,
      p_seat_ids: Array.from(selected),
      p_boarding_stop_id: null,
      p_dropping_stop_id: null,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    router.push(`/passenger/booking/${bookingId}`);
  }

  const bookedIds = new Set(allSeats.map((s) => s.id).filter((id) => !availableIds.has(id)));

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <h1 className="mb-4 font-display text-2xl text-ink">Choose your seats</h1>
        {loading ? (
          <div className="skeleton h-64 w-full rounded-lg" />
        ) : (
          <SeatMap seats={allSeats} bookedSeatIds={bookedIds} selectedSeatIds={selected} onToggle={toggleSeat} />
        )}
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>

      <Card className="h-fit">
        <h2 className="font-display text-lg text-ink">Fare summary</h2>
        <div className="mt-3 space-y-1 text-sm text-muted">
          <div className="flex justify-between">
            <span>Seats selected</span>
            <span>{selected.size}</span>
          </div>
          <div className="flex justify-between">
            <span>Fare per seat</span>
            <span>₹{FARE_PER_SEAT}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-medium text-ink">
            <span>Total</span>
            <span>₹{selected.size * FARE_PER_SEAT}</span>
          </div>
        </div>
        <Button className="mt-4 w-full" onClick={handleContinue} disabled={selected.size === 0}>
          Continue
        </Button>
        <p className="mt-2 text-xs text-muted">
          Your seats are held for 10 minutes while you complete passenger details and payment.
        </p>
      </Card>
    </div>
  );
}

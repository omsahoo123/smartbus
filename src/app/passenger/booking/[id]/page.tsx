"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import {
  getBookingWithLockedSeats,
  setBookingAmount,
  confirmBookingPayment,
} from "@/services/bookings";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  User,
  ArrowRight,
  Bus,
  RefreshCw,
} from "lucide-react";

const FARE_PER_SEAT = 499;
const CONVENIENCE_FEE = 15;

interface PassengerRow {
  seatId: string;
  seatNumber: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
}

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const bookingId = params.id;
  const router = useRouter();
  const supabase = createClient();

  const [bookingData, setBookingData] = useState<any>(null);
  const [step, setStep] = useState<"details" | "payment" | "done">("details");
  const [rows, setRows] = useState<PassengerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Load booking and locked seats
  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { booking, seats } = await getBookingWithLockedSeats(supabase, bookingId);

      if (!booking) {
        setError("Booking reservation not found.");
        setLoading(false);
        return;
      }

      setBookingData(booking);

      // Check if already confirmed
      if (booking.booking_status === "confirmed") {
        setStep("done");
        setLoading(false);
        return;
      }

      // Check if expired
      const expiry = booking.hold_expires_at ? new Date(booking.hold_expires_at).getTime() : 0;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      if (remaining <= 0 || booking.booking_status === "expired") {
        setIsExpired(true);
        setSecondsRemaining(0);
        setLoading(false);
        return;
      }

      setSecondsRemaining(remaining);

      // Initialize passenger rows from locked seats
      const initialRows: PassengerRow[] = seats.map((seat: any) => ({
        seatId: seat.id,
        seatNumber: seat.seat_number,
        name: "",
        age: "",
        gender: "male",
        phone: "",
      }));

      setRows(initialRows);
    } catch (err: any) {
      setError(err.message || "Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, supabase]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  // Live Countdown Timer
  useEffect(() => {
    if (secondsRemaining === null || isExpired || step === "done") return;

    if (secondsRemaining <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isExpired, step]);

  function updateRow(i: number, field: keyof PassengerRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (isExpired) {
      setError("Seat hold has expired. Please reserve your seats again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Clean up any existing passenger drafts for this booking
      await supabase.from("booking_passengers").delete().eq("booking_id", bookingId);

      const inserts = rows.map((r) => ({
        booking_id: bookingId,
        seat_id: r.seatId,
        name: r.name.trim(),
        age: Number(r.age),
        gender: r.gender,
        phone: r.phone.trim() || null,
      }));

      const { error: insertError } = await supabase.from("booking_passengers").insert(inserts);
      if (insertError) throw insertError;

      const totalFare = rows.length * FARE_PER_SEAT + CONVENIENCE_FEE;
      await setBookingAmount(supabase, bookingId, totalFare);

      setStep("payment");
    } catch (err: any) {
      setError(err.message || "Failed to save passenger details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay() {
    if (isExpired) {
      setError("Seat hold has expired. Payment cannot be processed.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const mockTxnId = `TXN-${Date.now().toString().slice(-8)}`;
      await confirmBookingPayment(supabase, bookingId, mockTxnId);
      setStep("done");
    } catch (err: any) {
      // Transition / concurrency error handling:
      // If the database detects hold expiration or concurrency conflict:
      if (err.message && err.message.toLowerCase().includes("expired")) {
        setIsExpired(true);
      }
      setError(err.message || "Payment verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="skeleton h-48 w-full rounded-2xl" />
      </div>
    );
  }

  // EXPIRED HOLD SCREEN
  if (isExpired) {
    return (
      <Card className="mx-auto max-w-md text-center p-8 border-danger/30 shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Seat Reservation Expired</h1>
        <p className="mt-2 text-sm text-muted">
          Your 10-minute temporary seat hold timed out. To prevent double-booking, the reserved seats have been returned to inventory.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {bookingData?.trip_id && (
            <Link
              href={`/passenger/buses/${bookingData.trip_id}`}
              className="rounded-xl bg-primary py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition"
            >
              Select Seats Again
            </Link>
          )}
          <Link
            href="/passenger/search"
            className="rounded-xl border border-line bg-surface py-2.5 px-4 text-xs font-semibold text-ink hover:bg-bg transition"
          >
            Back to Search
          </Link>
        </div>
      </Card>
    );
  }

  // BOOKING CONFIRMED SUCCESS SCREEN
  if (step === "done") {
    return (
      <Card className="mx-auto max-w-md text-center p-8 bg-surface shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4 animate-bounce">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Booking Confirmed!</h1>
        <p className="mt-1 text-xs font-mono font-bold text-primary">
          Code: {bookingData?.booking_code}
        </p>
        <p className="mt-2 text-xs text-muted">
          Your seat allocation is permanently registered in the database.
        </p>
        <Button
          className="mt-6 w-full"
          onClick={() => router.push(`/passenger/tickets/${bookingId}`)}
        >
          View QR Ticket
        </Button>
      </Card>
    );
  }

  const trip = bookingData?.trip;

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-in fade-in duration-300">
      {/* TRIP HUD BANNER */}
      <div className="rounded-2xl bg-surface border border-line p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-bg px-2 py-0.5 rounded border border-line">
              {trip?.bus?.bus_number}
            </span>
            <span className="text-xs font-semibold text-ink">
              {trip?.route?.source} &rarr; {trip?.route?.destination}
            </span>
          </div>

          {/* COUNTDOWN TIMER BADGE */}
          {secondsRemaining !== null && (
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-bold ${
                secondsRemaining < 120
                  ? "bg-danger/15 text-danger animate-pulse"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted pt-2 border-t border-line/60">
          <span>Date: <strong className="text-ink">{trip?.trip_date}</strong></span>
          <span>•</span>
          <span>
            Seats:{" "}
            <strong className="text-primary font-bold">
              {rows.map((r) => r.seatNumber).join(", ")}
            </strong>
          </span>
          {bookingData?.boarding_stop && (
            <>
              <span>•</span>
              <span>Boarding: <strong className="text-ink">{bookingData.boarding_stop.name}</strong></span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">
          {step === "details" ? "Passenger Details" : "Secure Checkout"}
        </h1>
        <span className="text-xs font-semibold text-muted">
          Step {step === "details" ? "1 of 2" : "2 of 2"}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: PASSENGER DETAILS FORM */}
      {step === "details" && (
        <form onSubmit={handleSaveDetails} className="space-y-4">
          {rows.map((row, i) => (
            <Card key={row.seatId || i} className="p-5">
              <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-ink">Passenger {i + 1}</span>
                </div>
                <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary font-mono">
                  Seat {row.seatNumber}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Ramesh Sahoo"
                  value={row.name}
                  onChange={(e) => updateRow(i, "name", e.target.value)}
                />
                <Input
                  label="Age"
                  type="number"
                  required
                  min={1}
                  max={120}
                  placeholder="28"
                  value={row.age}
                  onChange={(e) => updateRow(i, "age", e.target.value)}
                />
                <Select
                  label="Gender"
                  value={row.gender}
                  onChange={(e) => updateRow(i, "gender", e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
                <Input
                  label="Contact Phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={row.phone}
                  onChange={(e) => updateRow(i, "phone", e.target.value)}
                />
              </div>
            </Card>
          ))}

          <Button type="submit" className="w-full text-sm font-bold" disabled={submitting}>
            {submitting ? "Saving Passenger Info..." : "Proceed to Payment"}
          </Button>
        </form>
      )}

      {/* STEP 2: PAYMENT CONFIRMATION */}
      {step === "payment" && (
        <Card className="p-6 space-y-5">
          <div className="space-y-3 text-sm">
            <h3 className="font-display font-bold text-ink border-b border-line pb-2">
              Fare Breakdown
            </h3>
            <div className="flex justify-between text-muted">
              <span>Base Fare ({rows.length} {rows.length === 1 ? "seat" : "seats"} × ₹{FARE_PER_SEAT})</span>
              <span className="font-semibold text-ink">₹{rows.length * FARE_PER_SEAT}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Convenience Fee & GST</span>
              <span className="font-semibold text-ink">₹{CONVENIENCE_FEE}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-lg font-extrabold text-ink">
              <span>Total Payable</span>
              <span className="text-xl text-primary font-black">
                ₹{rows.length * FARE_PER_SEAT + CONVENIENCE_FEE}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-bg p-3.5 border border-line text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Instant Digital QR Verification</span>
            </div>
            <p className="text-muted leading-relaxed">
              Upon successful payment, an encrypted QR ticket is generated and added to your wallet.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setStep("details")}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              className="flex-1 font-bold"
              onClick={handlePay}
              disabled={submitting || isExpired}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying Transaction...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Pay ₹{rows.length * FARE_PER_SEAT + CONVENIENCE_FEE} & Confirm</span>
                </span>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

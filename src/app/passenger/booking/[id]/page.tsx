"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { setBookingAmount, confirmBookingPayment } from "@/services/bookings";

const FARE_PER_SEAT = 499;

interface PassengerRow {
  seatId: string;
  seatNumber: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
}

// params.id here is the booking id created by reserve_seats() on the
// previous seat-selection screen.
export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const bookingId = params.id;
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"details" | "payment" | "done">("details");
  const [rows, setRows] = useState<PassengerRow[]>([{ seatId: "", seatNumber: "1A", name: "", age: "", gender: "male", phone: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateRow(i: number, field: keyof PassengerRow, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Look up the seat_ids actually locked for this booking so passenger
    // rows attach to the correct seat, then write the passenger rows.
    const { data: locks } = await supabase.from("trip_seat_locks").select("seat_id").eq("booking_id", bookingId);
    const seatIds = (locks ?? []).map((l: any) => l.seat_id);

    const inserts = rows.map((r, i) => ({
      booking_id: bookingId,
      seat_id: seatIds[i] ?? seatIds[0],
      name: r.name,
      age: Number(r.age),
      gender: r.gender,
      phone: r.phone,
    }));

    const { error: insertError } = await supabase.from("booking_passengers").insert(inserts);
    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    try {
      await setBookingAmount(supabase, bookingId, rows.length * FARE_PER_SEAT);
      setStep("payment");
    } catch (err: any) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    try {
      // Mock gateway transaction id. Swap this button for the Razorpay
      // checkout widget once RAZORPAY_KEY_ID/SECRET are configured, and
      // verify the payment server-side before calling confirm_booking_payment.
      const mockTxnId = `MOCK-${Date.now()}`;
      await confirmBookingPayment(supabase, bookingId, mockTxnId);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  if (step === "done") {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl text-ink">Booking confirmed 🎉</h1>
        <p className="mt-2 text-sm text-muted">Your digital ticket is ready.</p>
        <Button className="mt-5" onClick={() => router.push(`/passenger/tickets/${bookingId}`)}>
          View my ticket
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl text-ink">
        {step === "details" ? "Passenger details" : "Payment"}
      </h1>

      {step === "details" && (
        <form onSubmit={handleSaveDetails} className="space-y-4">
          {rows.map((row, i) => (
            <Card key={i}>
              <p className="mb-3 text-sm font-medium text-ink">Passenger {i + 1} &middot; Seat {row.seatNumber}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Name" required value={row.name} onChange={(e) => updateRow(i, "name", e.target.value)} />
                <Input label="Age" type="number" required min={1} value={row.age} onChange={(e) => updateRow(i, "age", e.target.value)} />
                <Select label="Gender" value={row.gender} onChange={(e) => updateRow(i, "gender", e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
                <Input label="Phone" type="tel" value={row.phone} onChange={(e) => updateRow(i, "phone", e.target.value)} />
              </div>
            </Card>
          ))}

          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : "Continue to payment"}
          </Button>
        </form>
      )}

      {step === "payment" && (
        <Card>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Fare</span><span>₹{rows.length * FARE_PER_SEAT}</span></div>
            <div className="flex justify-between"><span className="text-muted">Convenience fee</span><span>₹15</span></div>
            <div className="flex justify-between border-t border-line pt-2 font-medium text-ink">
              <span>Total</span><span>₹{rows.length * FARE_PER_SEAT + 15}</span>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <Button className="mt-5 w-full" onClick={handlePay} disabled={submitting}>
            {submitting ? "Verifying payment..." : "Pay with UPI / Card"}
          </Button>
          <p className="mt-2 text-xs text-muted">
            Payment gateway integration is stubbed for now &mdash; wire up Razorpay in lib/payments once this flow is confirmed working end to end.
          </p>
        </Card>
      )}
    </div>
  );
}

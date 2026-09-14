import { SupabaseClient } from "@supabase/supabase-js";

export interface ReserveSeatsInput {
  tripId: string;
  userId: string;
  seatIds: string[];
  boardingStopId: string | null;
  droppingStopId: string | null;
}

// Calls the atomic reserve_seats() Postgres function -- the only supported
// way to create a booking. This guarantees two passengers can never lock
// the same seat on the same trip, even under concurrent requests.
export async function reserveSeats(supabase: SupabaseClient, input: ReserveSeatsInput) {
  const { data, error } = await supabase.rpc("reserve_seats", {
    p_trip_id: input.tripId,
    p_user_id: input.userId,
    p_seat_ids: input.seatIds,
    p_boarding_stop_id: input.boardingStopId,
    p_dropping_stop_id: input.droppingStopId,
  });
  if (error) throw error;
  return data as string; // booking id
}

export async function availableSeatsForTrip(supabase: SupabaseClient, tripId: string) {
  const { data, error } = await supabase.rpc("available_seats_for_trip", { p_trip_id: tripId });
  if (error) throw error;
  return data;
}

export async function setBookingAmount(supabase: SupabaseClient, bookingId: string, amount: number) {
  const { error } = await supabase.rpc("set_booking_amount", { p_booking_id: bookingId, p_amount: amount });
  if (error) throw error;
}

// In production this should run after your payment gateway's webhook
// verifies the transaction server-side -- do not call this straight from
// the client based only on a gateway "success" redirect.
export async function confirmBookingPayment(supabase: SupabaseClient, bookingId: string, transactionId: string) {
  const { data, error } = await supabase.rpc("confirm_booking_payment", {
    p_booking_id: bookingId,
    p_transaction_id: transactionId,
  });
  if (error) throw error;
  return data as string; // ticket id
}

export async function cancelBooking(supabase: SupabaseClient, bookingId: string) {
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });
  if (error) throw error;
}

export async function listMyBookings(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, booking_code, total_amount, payment_status, booking_status, created_at,
       trip:trips ( trip_date, route:routes ( route_name, source, destination ), bus:buses ( bus_number ) ),
       ticket:tickets ( qr_token, status )`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

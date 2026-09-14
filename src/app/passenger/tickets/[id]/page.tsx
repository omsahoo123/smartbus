import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TicketCard } from "@/components/booking/TicketCard";
import { Button } from "@/components/ui/Button";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: bookingRow } = await supabase
    .from("bookings")
    .select(
      `id, booking_code, booking_status,
       trip:trips ( trip_date, route:routes ( route_name ), bus:buses ( bus_number ) ),
       boarding:stops!bookings_boarding_stop_id_fkey ( name ),
       dropping:stops!bookings_dropping_stop_id_fkey ( name ),
       passengers:booking_passengers ( name, seat:seats ( seat_number ) ),
       ticket:tickets ( qr_token, status )`
    )
    .eq("id", params.id)
    .single();

  const booking = bookingRow as any;
  if (!booking) notFound();

  const qrDataUrl = booking.ticket?.[0]?.qr_token
    ? await QRCode.toDataURL(booking.ticket[0].qr_token)
    : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="font-display text-2xl text-ink">Ticket</h1>
      <TicketCard
        bookingCode={booking.booking_code}
        busNumber={booking.trip?.bus?.bus_number ?? "—"}
        routeName={booking.trip?.route?.route_name ?? "—"}
        tripDate={booking.trip?.trip_date ?? "—"}
        seatNumbers={(booking.passengers ?? []).map((p: any) => p.seat?.seat_number).filter(Boolean)}
        boardingPoint={booking.boarding?.name ?? "—"}
        droppingPoint={booking.dropping?.name ?? "—"}
        status={booking.booking_status}
        qrDataUrl={qrDataUrl}
      />
      <div className="flex gap-3">
        <Button variant="secondary">Download</Button>
        <Button variant="secondary">Share</Button>
        {booking.booking_status === "confirmed" && <Button variant="danger">Cancel ticket</Button>}
      </div>
    </div>
  );
}

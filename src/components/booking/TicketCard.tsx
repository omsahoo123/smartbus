import Image from "next/image";

export function TicketCard({
  bookingCode,
  busNumber,
  routeName,
  tripDate,
  seatNumbers,
  boardingPoint,
  droppingPoint,
  status,
  qrDataUrl,
}: {
  bookingCode: string;
  busNumber: string;
  routeName: string;
  tripDate: string;
  seatNumbers: string[];
  boardingPoint: string;
  droppingPoint: string;
  status: string;
  qrDataUrl?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between bg-primary px-5 py-3 text-white">
        <span className="font-display text-lg">SmartBus</span>
        <span className="text-xs uppercase tracking-normal">{status}</span>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:justify-between">
        <div className="space-y-1 text-sm">
          <p className="text-xs text-muted">Booking code</p>
          <p className="font-display text-lg text-ink">{bookingCode}</p>
          <p className="mt-3 text-ink">{routeName}</p>
          <p className="text-muted">{busNumber} &middot; {tripDate}</p>
          <p className="text-muted">Seats: {seatNumbers.join(", ")}</p>
          <p className="text-muted">{boardingPoint} → {droppingPoint}</p>
        </div>
        {qrDataUrl && (
          <Image src={qrDataUrl} alt="Ticket QR code" width={120} height={120} className="self-center" />
        )}
      </div>
    </div>
  );
}

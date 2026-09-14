import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AdminBookingsPage() {
  const supabase = createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, total_amount, payment_status, booking_status, created_at, user:profiles ( full_name ), trip:trips ( trip_date, route:routes ( route_name ) )"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">All bookings</h1>
      <DataTable
        rows={(bookings ?? []) as any[]}
        columns={[
          { header: "Code", cell: (b: any) => b.booking_code },
          { header: "Passenger", cell: (b: any) => b.user?.full_name },
          { header: "Route", cell: (b: any) => b.trip?.route?.route_name },
          { header: "Amount", cell: (b: any) => `₹${b.total_amount}` },
          { header: "Payment", cell: (b: any) => <StatusBadge status={b.payment_status} /> },
          { header: "Booking", cell: (b: any) => <StatusBadge status={b.booking_status} /> },
        ]}
        emptyLabel="No bookings yet."
      />
    </div>
  );
}

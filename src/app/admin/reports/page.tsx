import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/ui/Card";

export default async function AdminReportsPage() {
  const supabase = createClient();

  const { data: payments } = await supabase.from("payments").select("amount, status");
  const totalRevenue = (payments ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalRefunded = (payments ?? []).filter((p: any) => p.status === "refunded").reduce((s: number, p: any) => s + Number(p.amount), 0);

  const { count: totalBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true });
  const { count: cancelledBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("booking_status", "cancelled");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-ink">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} />
        <StatsCard label="Refunded" value={`₹${totalRefunded.toLocaleString("en-IN")}`} />
        <StatsCard label="Total bookings" value={totalBookings ?? 0} />
        <StatsCard label="Cancelled bookings" value={cancelledBookings ?? 0} />
      </div>
      <p className="text-sm text-muted">
        Extend this page with date-range filters and charts (e.g. Recharts) once real traffic data is flowing.
      </p>
    </div>
  );
}

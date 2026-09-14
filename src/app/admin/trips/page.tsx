import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AdminTripsPage() {
  const supabase = createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, trip_date, status, route:routes ( route_name ), bus:buses ( bus_number )")
    .order("trip_date", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Trips</h1>
      <DataTable
        rows={(trips ?? []) as any[]}
        columns={[
          { header: "Date", cell: (t: any) => t.trip_date },
          { header: "Route", cell: (t: any) => t.route?.route_name },
          { header: "Bus", cell: (t: any) => t.bus?.bus_number },
          { header: "Status", cell: (t: any) => <StatusBadge status={t.status} /> },
        ]}
        emptyLabel="No trips yet."
      />
    </div>
  );
}

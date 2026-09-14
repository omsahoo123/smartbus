import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function DriverTripsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const { data: driver } = await supabase.from("drivers").select("id").eq("profile_id", user?.id ?? "").single();

  const { data: trips } = await supabase
    .from("trips")
    .select("id, trip_date, status, route:routes ( route_name )")
    .eq("driver_id", driver?.id ?? "")
    .order("trip_date", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">My trips</h1>
      <DataTable
        rows={(trips ?? []) as any[]}
        columns={[
          { header: "Date", cell: (t: any) => t.trip_date },
          { header: "Route", cell: (t: any) => t.route?.route_name },
          { header: "Status", cell: (t: any) => <StatusBadge status={t.status} /> },
          { header: "", cell: (t: any) => <Link href={`/driver/trips/${t.id}`} className="text-primary hover:underline">Open</Link> },
        ]}
        emptyLabel="No trips assigned yet."
      />
    </div>
  );
}

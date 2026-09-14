import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";

export default async function AdminSchedulesPage() {
  const supabase = createClient();
  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, departure_time, arrival_time, status, route:routes ( route_name ), bus:buses ( bus_number )");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Schedules</h1>
      <DataTable
        rows={(schedules ?? []) as any[]}
        columns={[
          { header: "Route", cell: (s: any) => s.route?.route_name },
          { header: "Bus", cell: (s: any) => s.bus?.bus_number },
          { header: "Departure", cell: (s: any) => s.departure_time },
          { header: "Arrival", cell: (s: any) => s.arrival_time },
          { header: "Status", cell: (s: any) => s.status },
        ]}
        emptyLabel="No schedules yet."
      />
    </div>
  );
}

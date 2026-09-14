import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";

// Read-only listing shown here; duplicate the modal-form pattern from
// admin/buses/page.tsx to add full create/edit/delete for routes.
export default async function AdminRoutesPage() {
  const supabase = createClient();
  const { data: routes } = await supabase.from("routes").select("*").order("route_name");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Routes</h1>
      <DataTable
        rows={(routes ?? []) as any[]}
        columns={[
          { header: "Route", cell: (r: any) => r.route_name },
          { header: "Source", cell: (r: any) => r.source },
          { header: "Destination", cell: (r: any) => r.destination },
          { header: "Distance", cell: (r: any) => (r.distance ? `${r.distance} km` : "—") },
          { header: "Status", cell: (r: any) => r.status },
        ]}
        emptyLabel="No routes yet."
      />
    </div>
  );
}

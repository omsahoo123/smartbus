import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";

export default async function AdminStopsPage() {
  const supabase = createClient();
  const { data: stops } = await supabase.from("stops").select("*").order("name");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Stops</h1>
      <DataTable
        rows={(stops ?? []) as any[]}
        columns={[
          { header: "Name", cell: (s: any) => s.name },
          { header: "Address", cell: (s: any) => s.address ?? "—" },
          { header: "Coordinates", cell: (s: any) => `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}` },
        ]}
        emptyLabel="No stops yet."
      />
    </div>
  );
}

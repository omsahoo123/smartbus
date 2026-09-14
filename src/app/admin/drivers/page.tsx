import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";

export default async function AdminDriversPage() {
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, license_number, status, profile:profiles ( full_name, phone ), bus:buses ( bus_number )");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Drivers</h1>
      <DataTable
        rows={(drivers ?? []) as any[]}
        columns={[
          { header: "Name", cell: (d: any) => d.profile?.full_name },
          { header: "Phone", cell: (d: any) => d.profile?.phone },
          { header: "License", cell: (d: any) => d.license_number },
          { header: "Assigned bus", cell: (d: any) => d.bus?.bus_number ?? "—" },
          { header: "Status", cell: (d: any) => d.status },
        ]}
        emptyLabel="No drivers yet. Promote a signed-up user to driver from Users, then assign a license and bus here."
      />
    </div>
  );
}

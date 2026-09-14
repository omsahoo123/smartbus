import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AdminPassesPage() {
  const supabase = createClient();
  const { data: passes } = await supabase
    .from("passes")
    .select("id, pass_type, valid_from, valid_until, amount, status, user:profiles ( full_name )")
    .order("valid_from", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Passes</h1>
      <DataTable
        rows={(passes ?? []) as any[]}
        columns={[
          { header: "Passenger", cell: (p: any) => p.user?.full_name },
          { header: "Type", cell: (p: any) => p.pass_type.replace("_", " ") },
          { header: "Valid", cell: (p: any) => `${p.valid_from} → ${p.valid_until}` },
          { header: "Amount", cell: (p: any) => `₹${p.amount}` },
          { header: "Status", cell: (p: any) => <StatusBadge status={p.status} /> },
        ]}
        emptyLabel="No passes sold yet."
      />
    </div>
  );
}

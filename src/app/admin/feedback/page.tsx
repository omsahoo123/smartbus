import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/DataTable";

export default async function AdminFeedbackPage() {
  const supabase = createClient();
  const { data: feedback } = await supabase
    .from("feedback")
    .select("id, overall_rating, comment, created_at, user:profiles ( full_name )")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Feedback</h1>
      <DataTable
        rows={(feedback ?? []) as any[]}
        columns={[
          { header: "Passenger", cell: (f: any) => f.user?.full_name },
          { header: "Overall rating", cell: (f: any) => `${f.overall_rating ?? "—"}/5` },
          { header: "Comment", cell: (f: any) => f.comment ?? "—" },
        ]}
        emptyLabel="No feedback submitted yet."
      />
    </div>
  );
}

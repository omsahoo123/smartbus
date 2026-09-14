import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function NotificationsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Notifications</h1>
      {(notifications ?? []).length === 0 && (
        <Card className="border-dashed text-center text-sm text-muted">You&apos;re all caught up.</Card>
      )}
      <div className="space-y-2">
        {(notifications ?? []).map((n: any) => (
          <Card key={n.id} className={n.read_at ? "opacity-70" : ""}>
            <p className="text-sm font-medium text-ink">{n.title}</p>
            <p className="text-xs text-muted">{n.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

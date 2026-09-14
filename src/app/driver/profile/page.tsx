import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function DriverProfilePage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id ?? "").single();
  const { data: driverRow } = await supabase
    .from("drivers")
    .select("license_number, status, bus:buses ( bus_number, bus_type )")
    .eq("profile_id", user?.id ?? "")
    .single();
  const driver = driverRow as any;

  return (
    <Card className="mx-auto max-w-md space-y-2">
      <h1 className="font-display text-2xl text-ink">Driver profile</h1>
      <p className="text-sm text-ink">{profile?.full_name}</p>
      <p className="text-sm text-muted">{profile?.phone}</p>
      <p className="text-sm text-muted">License: {driver?.license_number}</p>
      <p className="text-sm text-muted">Assigned bus: {driver?.bus?.bus_number ?? "Not assigned"}</p>
    </Card>
  );
}

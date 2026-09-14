import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function DriverTrackingPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const { data: driver } = await supabase.from("drivers").select("id").eq("profile_id", user?.id ?? "").single();

  const { data: runningTrip } = await supabase
    .from("trips")
    .select("id")
    .eq("driver_id", driver?.id ?? "")
    .eq("status", "running")
    .maybeSingle();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Live tracking</h1>
      {runningTrip ? (
        <Card>
          <p className="text-sm text-ink">You have a trip in progress.</p>
          <Link href={`/driver/trips/${runningTrip.id}`} className="text-primary hover:underline">
            Open active trip &amp; GPS sharing
          </Link>
        </Card>
      ) : (
        <Card className="border-dashed text-center text-sm text-muted">
          Start a trip from your dashboard to begin sharing your location.
        </Card>
      )}
    </div>
  );
}

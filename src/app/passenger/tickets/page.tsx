import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { listMyBookings } from "@/services/bookings";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function TicketsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const bookings = user ? await listMyBookings(supabase, user.id) : [];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">My tickets</h1>

      {bookings.length === 0 && (
        <Card className="border-dashed text-center text-sm text-muted">
          No bookings yet. Search a route from your dashboard to book one.
        </Card>
      )}

      <div className="space-y-3">
        {bookings.map((b: any) => (
          <Link key={b.id} href={`/passenger/tickets/${b.id}`}>
            <Card className="flex items-center justify-between hover:border-primary">
              <div>
                <p className="text-sm font-medium text-ink">{b.trip?.route?.route_name}</p>
                <p className="text-xs text-muted">
                  {b.trip?.trip_date} &middot; {b.trip?.bus?.bus_number} &middot; {b.booking_code}
                </p>
              </div>
              <StatusBadge status={b.booking_status} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

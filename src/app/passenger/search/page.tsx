import { createClient } from "@/lib/supabase/server";
import { searchTrips } from "@/services/routes";
import { availableSeatsForTrip } from "@/services/bookings";
import { BusCard } from "@/components/booking/BusCard";
import { Card } from "@/components/ui/Card";

// Server component: reads ?source=&destination=&date= from the URL (the
// dashboard search form submits a plain GET here) and renders matching
// scheduled trips as bus cards.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { source?: string; destination?: string; date?: string };
}) {
  const supabase = createClient();
  const source = searchParams.source ?? "";
  const destination = searchParams.destination ?? "";
  const date = searchParams.date ?? new Date().toISOString().slice(0, 10);

  const hasQuery = Boolean(source && destination);
  const trips = hasQuery ? await searchTrips(supabase, { source, destination, date }) : [];

  const tripsWithSeats = await Promise.all(
    (trips ?? []).map(async (t: any) => {
      const seats = await availableSeatsForTrip(supabase, t.id);
      return { ...t, seatsLeft: seats?.length ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Search results</h1>
        <p className="text-sm text-muted">
          {hasQuery ? `${source} → ${destination} on ${date}` : "Enter a route from the dashboard to search."}
        </p>
      </div>

      {!hasQuery && (
        <Card className="border-dashed text-center text-sm text-muted">
          Go back to the dashboard and enter a from/to city and date.
        </Card>
      )}

      {hasQuery && tripsWithSeats.length === 0 && (
        <Card className="border-dashed text-center text-sm text-muted">
          No buses found for this route and date. Try a different date.
        </Card>
      )}

      <div className="space-y-4">
        {tripsWithSeats.map((t: any) => (
          <BusCard
            key={t.id}
            tripId={t.id}
            busNumber={t.bus?.bus_number ?? "—"}
            busType={t.bus?.bus_type ?? "seater"}
            routeName={t.route?.route_name ?? ""}
            source={t.route?.source ?? source}
            destination={t.route?.destination ?? destination}
            departureTime={t.schedule?.departure_time ?? "—"}
            arrivalTime={t.schedule?.arrival_time ?? "—"}
            fare={499}
            seatsLeft={t.seatsLeft}
            status={t.status}
          />
        ))}
      </div>
    </div>
  );
}

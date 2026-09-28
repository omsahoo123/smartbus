import { createClient } from "@/lib/supabase/server";
import { searchTrips } from "@/services/routes";
import { availableSeatsForTrip } from "@/services/bookings";
import { listStops } from "@/services/stops";
import { SearchResultsView, SearchResultsTripItem } from "@/components/booking/SearchResultsView";

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
  const rawTrips = hasQuery ? await searchTrips(supabase, { source, destination, date }).catch(() => []) : [];
  const stops = await listStops(supabase).catch(() => []);
  const stopNames = (stops || []).map((s: any) => s.name);

  const tripsWithSeats: SearchResultsTripItem[] = await Promise.all(
    (rawTrips ?? []).map(async (t: any) => {
      const seats = await availableSeatsForTrip(supabase, t.id).catch(() => []);
      const routeStops = (t.route?.route_stops || []).map((rs: any) => ({
        name: rs.stop?.name || "Transit Stop",
        sequence: rs.sequence,
      }));

      return {
        id: t.id,
        tripId: t.id,
        busNumber: t.bus?.bus_number ?? "OD-02-101",
        busType: t.bus?.bus_type ?? "seater",
        routeName: t.route?.route_name ?? "Odisha Capital Region Transit",
        source: t.route?.source ?? source,
        destination: t.route?.destination ?? destination,
        departureTime: t.schedule?.departure_time ?? "08:00 AM",
        arrivalTime: t.schedule?.arrival_time ?? "10:30 AM",
        fare: 499,
        seatsLeft: seats?.length ?? 40,
        status: t.status ?? "scheduled",
        stops: routeStops,
      };
    })
  );

  return (
    <SearchResultsView
      source={source}
      destination={destination}
      date={date}
      stopNames={stopNames}
      trips={tripsWithSeats}
    />
  );
}

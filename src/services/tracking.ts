import { SupabaseClient } from "@supabase/supabase-js";

export async function sendLocationUpdate(
  supabase: SupabaseClient,
  input: { tripId: string; busId: string; latitude: number; longitude: number; speed?: number }
) {
  const { error } = await supabase.from("trip_locations").insert({
    trip_id: input.tripId,
    bus_id: input.busId,
    latitude: input.latitude,
    longitude: input.longitude,
    speed: input.speed ?? null,
  });
  if (error) throw error;
}

export async function getLatestLocation(supabase: SupabaseClient, tripId: string) {
  const { data, error } = await supabase
    .from("trip_locations")
    .select("*")
    .eq("trip_id", tripId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Subscribe to realtime inserts on trip_locations for a given trip. Returns
// the channel so the caller can unsubscribe on unmount.
export function subscribeToTripLocation(
  supabase: SupabaseClient,
  tripId: string,
  onUpdate: (payload: any) => void
) {
  return supabase
    .channel(`trip-location-${tripId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "trip_locations", filter: `trip_id=eq.${tripId}` },
      onUpdate
    )
    .subscribe();
}

import { SupabaseClient } from "@supabase/supabase-js";

// Search available trips between a source and destination on a given date.
// Seat availability is resolved per-trip via the available_seats_for_trip RPC,
// never from a cached/global count.
export async function searchTrips(
  supabase: SupabaseClient,
  params: { source: string; destination: string; date: string }
) {
  const { data, error } = await supabase
    .from("trips")
    .select(
      `id, trip_date, status,
       bus:buses ( id, bus_number, bus_type, capacity ),
       route:routes!inner ( id, route_name, source, destination, distance ),
       schedule:schedules ( departure_time, arrival_time )`
    )
    .eq("trip_date", params.date)
    .ilike("route.source", `%${params.source}%`)
    .ilike("route.destination", `%${params.destination}%`)
    .in("status", ["scheduled", "running"]);

  if (error) throw error;
  return data;
}

export async function listRoutes(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("routes").select("*").order("route_name");
  if (error) throw error;
  return data;
}

export async function createRoute(
  supabase: SupabaseClient,
  input: { route_name: string; source: string; destination: string; distance?: number; estimated_duration?: string; status: string }
) {
  const { data, error } = await supabase.from("routes").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateRoute(
  supabase: SupabaseClient,
  id: string,
  input: Partial<{ route_name: string; source: string; destination: string; distance: number; estimated_duration: string; status: string }>
) {
  const { data, error } = await supabase.from("routes").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRoute(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("routes").delete().eq("id", id);
  if (error) throw error;
}

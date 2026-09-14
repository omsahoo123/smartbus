import { SupabaseClient } from "@supabase/supabase-js";

export interface TripRow {
  id: string;
  bus_id: string;
  route_id: string;
  driver_id: string | null;
  schedule_id: string | null;
  trip_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  created_at: string;
  route?: { route_name: string };
  bus?: { bus_number: string };
  driver?: { id: string; profile: { full_name: string | null } } | null;
}

export async function listTrips(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("trips")
    .select("*, route:routes ( route_name ), bus:buses ( bus_number ), driver:drivers ( id, profile:profiles ( full_name ) )")
    .order("trip_date", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as TripRow[];
}

export async function assignDriverToTrip(supabase: SupabaseClient, tripId: string, driverId: string) {
  const { error } = await supabase
    .from("trips")
    .update({ driver_id: driverId })
    .eq("id", tripId);
  if (error) throw error;
}

export async function updateTripStatus(supabase: SupabaseClient, tripId: string, status: string) {
  const updates: Record<string, any> = { status };
  if (status === "running") updates.start_time = new Date().toISOString();
  if (status === "completed") updates.end_time = new Date().toISOString();
  const { error } = await supabase.from("trips").update(updates).eq("id", tripId);
  if (error) throw error;
}

export async function createTrip(
  supabase: SupabaseClient,
  input: {
    route_id: string;
    bus_id: string;
    driver_id: string | null;
    trip_date: string;
    status: string;
  }
) {
  const { data, error } = await supabase.from("trips").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTrip(supabase: SupabaseClient, tripId: string) {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
}

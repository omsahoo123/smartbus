import { SupabaseClient } from "@supabase/supabase-js";

// Search available trips between a source and destination on a given date.
// Seat availability is resolved per-trip via the available_seats_for_trip RPC,
// never from a cached/global count.
export async function searchTrips(
  supabase: SupabaseClient,
  params: { source: string; destination: string; date: string }
) {
  const { data: trips, error } = await supabase
    .from("trips")
    .select(
      `id, trip_date, status,
       bus:buses ( id, bus_number, bus_type, capacity ),
       route:routes!inner ( 
         id, route_name, source, destination, distance,
         route_stops ( stop:stops(name), sequence )
       ),
       schedule:schedules ( departure_time, arrival_time )`
    )
    .eq("trip_date", params.date)
    .in("status", ["scheduled", "running"]);

  if (error) throw error;

  const searchSource = params.source.toLowerCase();
  const searchDest = params.destination.toLowerCase();

  return trips.filter((trip: any) => {
    const route = trip.route;
    if (!route) return false;

    const sourceMatchRoute = route.source?.toLowerCase().includes(searchSource);
    const destMatchRoute = route.destination?.toLowerCase().includes(searchDest);

    if (sourceMatchRoute && destMatchRoute) return true;

    const stops = route.route_stops || [];
    
    let sourceSeq = -1;
    if (sourceMatchRoute) {
      sourceSeq = -999;
    } else {
      const match = stops.find((s: any) => s.stop?.name?.toLowerCase().includes(searchSource));
      if (match) sourceSeq = match.sequence;
    }

    let destSeq = -1;
    if (destMatchRoute) {
      destSeq = 999;
    } else {
      const match = stops.find((s: any) => s.stop?.name?.toLowerCase().includes(searchDest));
      if (match) destSeq = match.sequence;
    }

    return sourceSeq !== -1 && destSeq !== -1 && sourceSeq < destSeq;
  });
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

export async function listRouteStops(supabase: SupabaseClient, routeId: string) {
  const { data, error } = await supabase
    .from("route_stops")
    .select(`id, route_id, stop_id, sequence, arrival_time, departure_time, stop:stops ( id, name, latitude, longitude, address )`)
    .eq("route_id", routeId)
    .order("sequence", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addRouteStop(
  supabase: SupabaseClient,
  input: {
    route_id: string;
    stop_id: string;
    sequence: number;
    arrival_time?: string | null;
    departure_time?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("route_stops")
    .insert(input)
    .select(`id, route_id, stop_id, sequence, arrival_time, departure_time, stop:stops ( id, name, latitude, longitude, address )`)
    .single();
  if (error) throw error;
  return data;
}

export async function updateRouteStop(
  supabase: SupabaseClient,
  id: string,
  input: Partial<{ sequence: number; arrival_time: string | null; departure_time: string | null }>
) {
  const { data, error } = await supabase
    .from("route_stops")
    .update(input)
    .eq("id", id)
    .select(`id, route_id, stop_id, sequence, arrival_time, departure_time, stop:stops ( id, name, latitude, longitude, address )`)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRouteStop(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("route_stops").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderRouteStops(supabase: SupabaseClient, routeId: string, orderedStopIds: string[]) {
  // Try RPC first if available, else sequential updates
  try {
    const { error } = await supabase.rpc("reorder_route_stops", {
      p_route_id: routeId,
      p_stop_ids: orderedStopIds,
    });
    if (!error) return;
  } catch {
    // fallback
  }

  for (let i = 0; i < orderedStopIds.length; i++) {
    await supabase
      .from("route_stops")
      .update({ sequence: i + 1 })
      .eq("route_id", routeId)
      .eq("stop_id", orderedStopIds[i]);
  }
}


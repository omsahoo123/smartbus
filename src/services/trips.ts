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
  route?: { route_name: string; source?: string; destination?: string };
  bus?: { bus_number: string };
  driver?: { id: string; license_number?: string; profile?: { full_name: string | null; phone?: string | null } } | null;
  schedule?: { departure_time: string; arrival_time: string } | null;
}

export async function listTrips(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("trips")
    .select(
      "*, route:routes ( route_name, source, destination ), bus:buses ( bus_number ), driver:drivers ( id, license_number, profile:profiles ( full_name, phone ) ), schedule:schedules ( departure_time, arrival_time )"
    )
    .order("trip_date", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data as TripRow[];
}

export async function assignDriverToTrip(supabase: SupabaseClient, tripId: string, driverId: string | null) {
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

export interface AutoAssignResult {
  assignedCount: number;
  totalTrips: number;
  assignedBusCount: number;
  details: {
    busNumber: string;
    tripDate: string;
    driverName: string;
  }[];
}

/**
 * Automatically assign drivers assigned to buses in /admin/drivers
 * to trips for given dates (defaults to today and today+1).
 * If multiple drivers are assigned to the same bus (e.g. 2 drivers on SB-104),
 * trips for that bus are distributed in round-robin order:
 * Trip 1 -> Driver 1, Trip 2 -> Driver 2, Trip 3 -> Driver 1, etc.
 */
export async function autoAssignDriversForDates(
  supabase: SupabaseClient,
  options?: {
    dates?: string[];
    overwriteExisting?: boolean;
    busId?: string;
  }
): Promise<AutoAssignResult> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

  const targetDates =
    options?.dates && options.dates.length > 0 ? options.dates : [todayStr, tomorrowStr];

  const overwriteExisting = options?.overwriteExisting ?? false;

  // 1. Fetch active drivers with their assigned bus
  let driverQuery = supabase
    .from("drivers")
    .select(
      "id, profile_id, assigned_bus_id, license_number, status, created_at, profile:profiles ( full_name ), bus:buses ( bus_number )"
    )
    .eq("status", "active")
    .not("assigned_bus_id", "is", null)
    .order("created_at", { ascending: true });

  if (options?.busId) {
    driverQuery = driverQuery.eq("assigned_bus_id", options.busId);
  }

  const { data: driversData, error: driverErr } = await driverQuery;
  if (driverErr) throw driverErr;

  const activeDrivers = (driversData as any[]) || [];
  if (activeDrivers.length === 0) {
    return { assignedCount: 0, totalTrips: 0, assignedBusCount: 0, details: [] };
  }

  // Group drivers by assigned_bus_id
  const driversByBus = new Map<string, any[]>();
  for (const drv of activeDrivers) {
    if (!drv.assigned_bus_id) continue;
    if (!driversByBus.has(drv.assigned_bus_id)) {
      driversByBus.set(drv.assigned_bus_id, []);
    }
    driversByBus.get(drv.assigned_bus_id)!.push(drv);
  }

  // 2. Fetch trips for the target dates
  let tripsQuery = supabase
    .from("trips")
    .select(
      "id, bus_id, driver_id, trip_date, schedule_id, bus:buses ( bus_number ), schedule:schedules ( departure_time )"
    )
    .in("trip_date", targetDates)
    .order("trip_date", { ascending: true });

  if (options?.busId) {
    tripsQuery = tripsQuery.eq("bus_id", options.busId);
  }

  const { data: tripsData, error: tripsErr } = await tripsQuery;
  if (tripsErr) throw tripsErr;

  const trips = (tripsData as any[]) || [];
  let assignedCount = 0;
  const affectedBuses = new Set<string>();
  const details: AutoAssignResult["details"] = [];

  // Group trips by date, then by bus_id
  for (const d of targetDates) {
    const dayTrips = trips.filter((t) => t.trip_date === d);

    const dayTripsByBus = new Map<string, any[]>();
    for (const t of dayTrips) {
      if (!dayTripsByBus.has(t.bus_id)) {
        dayTripsByBus.set(t.bus_id, []);
      }
      dayTripsByBus.get(t.bus_id)!.push(t);
    }

    for (const [bId, busTrips] of dayTripsByBus.entries()) {
      const busDrivers = driversByBus.get(bId);
      if (!busDrivers || busDrivers.length === 0) continue;

      // Sort trips chronologically for the day
      busTrips.sort((a, b) => {
        const timeA = a.schedule?.departure_time || "";
        const timeB = b.schedule?.departure_time || "";
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return a.id.localeCompare(b.id);
      });

      // Round-robin distribution
      for (let i = 0; i < busTrips.length; i++) {
        const trip = busTrips[i];
        if (trip.driver_id && !overwriteExisting) {
          continue;
        }

        const assignedDriver = busDrivers[i % busDrivers.length];
        if (trip.driver_id !== assignedDriver.id) {
          const { error: updateErr } = await supabase
            .from("trips")
            .update({ driver_id: assignedDriver.id })
            .eq("id", trip.id);

          if (!updateErr) {
            assignedCount++;
            affectedBuses.add(bId);
            details.push({
              busNumber: trip.bus?.bus_number || "Bus",
              tripDate: d,
              driverName: assignedDriver.profile?.full_name || assignedDriver.license_number || "Driver",
            });
          }
        }
      }
    }
  }

  return {
    assignedCount,
    totalTrips: trips.length,
    assignedBusCount: affectedBuses.size,
    details,
  };
}


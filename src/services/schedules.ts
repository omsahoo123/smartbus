import { SupabaseClient } from "@supabase/supabase-js";

export interface ScheduleRow {
  id: string;
  route_id: string;
  bus_id: string;
  departure_time: string;
  arrival_time: string;
  days_of_week: number[];
  status: string;
  route?: { route_name: string };
  bus?: { bus_number: string };
}

export async function listSchedules(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("schedules")
    .select("*, route:routes ( route_name ), bus:buses ( bus_number )")
    .order("departure_time");
  if (error) throw error;
  return data as ScheduleRow[];
}

export async function createSchedule(
  supabase: SupabaseClient,
  input: { route_id: string; bus_id: string; departure_time: string; arrival_time: string; days_of_week: number[]; status: string }
) {
  const { data, error } = await supabase.from("schedules").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateSchedule(
  supabase: SupabaseClient,
  id: string,
  input: Partial<{ route_id: string; bus_id: string; departure_time: string; arrival_time: string; days_of_week: number[]; status: string }>
) {
  const { data, error } = await supabase.from("schedules").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSchedule(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw error;
}

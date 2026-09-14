import { SupabaseClient } from "@supabase/supabase-js";
import type { Bus } from "@/types/database";

export async function listBuses(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("buses").select("*").order("bus_number");
  if (error) throw error;
  return data as Bus[];
}

export async function createBus(supabase: SupabaseClient, input: Partial<Bus>) {
  const { data, error } = await supabase.from("buses").insert(input).select().single();
  if (error) throw error;
  return data as Bus;
}

export async function updateBus(supabase: SupabaseClient, id: string, input: Partial<Bus>) {
  const { data, error } = await supabase.from("buses").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Bus;
}

export async function deleteBus(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("buses").delete().eq("id", id);
  if (error) throw error;
}

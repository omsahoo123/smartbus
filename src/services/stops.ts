import { SupabaseClient } from "@supabase/supabase-js";
import type { Stop } from "@/types/database";

export async function listStops(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("stops").select("*").order("name");
  if (error) throw error;
  return data as Stop[];
}

export async function createStop(supabase: SupabaseClient, input: Partial<Stop>) {
  const { data, error } = await supabase.from("stops").insert(input).select().single();
  if (error) throw error;
  return data as Stop;
}

export async function updateStop(supabase: SupabaseClient, id: string, input: Partial<Stop>) {
  const { data, error } = await supabase.from("stops").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Stop;
}

export async function deleteStop(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("stops").delete().eq("id", id);
  if (error) throw error;
}

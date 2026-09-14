import { SupabaseClient } from "@supabase/supabase-js";

export interface DriverRow {
  id: string;
  profile_id: string;
  license_number: string;
  assigned_bus_id: string | null;
  status: string;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null; email: string | null };
  bus?: { bus_number: string } | null;
}

export async function listDrivers(supabase: SupabaseClient) {
  // 1. Find all profiles that have role='driver'
  const { data: driverProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email")
    .eq("role", "driver");

  // 2. Find existing driver records
  const { data: existingDrivers } = await supabase
    .from("drivers")
    .select("id, profile_id");

  const existingProfileIds = new Set((existingDrivers ?? []).map((d) => d.profile_id));

  // 3. Auto-sync: If a user is registered/promoted as driver, ensure they exist in drivers table
  if (driverProfiles && driverProfiles.length > 0) {
    for (const p of driverProfiles) {
      if (!existingProfileIds.has(p.id)) {
        const cleanPhone = (p.phone || "").replace(/\D/g, "");
        const fallbackLicense = cleanPhone
          ? `OD-DL-${cleanPhone}`
          : `OD-DL-${p.id.slice(0, 8).toUpperCase()}`;

        await supabase.from("drivers").insert({
          profile_id: p.id,
          license_number: fallbackLicense,
          status: "active",
        }).catch(() => {});
      }
    }
  }

  // 4. Return all drivers with linked profile and bus data
  const { data, error } = await supabase
    .from("drivers")
    .select("*, profile:profiles ( full_name, phone, email ), bus:buses ( bus_number )")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DriverRow[];
}

/** Profiles with role='driver' that do NOT yet have a record in the drivers table */
export async function listUnassignedDriverProfiles(supabase: SupabaseClient) {
  const { data: allDriverProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email")
    .eq("role", "driver");

  const { data: existingDrivers } = await supabase
    .from("drivers")
    .select("profile_id");

  const assignedIds = new Set((existingDrivers ?? []).map((d) => d.profile_id));
  return (allDriverProfiles ?? []).filter((p) => !assignedIds.has(p.id));
}

export async function createDriver(
  supabase: SupabaseClient,
  input: { profile_id: string; license_number: string; assigned_bus_id: string | null; status: string }
) {
  const { data, error } = await supabase.from("drivers").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateDriver(
  supabase: SupabaseClient,
  id: string,
  input: Partial<{ license_number: string; assigned_bus_id: string | null; status: string }>
) {
  const { data, error } = await supabase.from("drivers").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDriver(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  if (error) throw error;
}

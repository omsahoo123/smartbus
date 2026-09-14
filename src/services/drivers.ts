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

  const profilesMap = new Map((driverProfiles ?? []).map((p) => [p.id, p]));

  // 2. Find existing driver records
  const { data: existingDrivers } = await supabase
    .from("drivers")
    .select("id, profile_id");

  const existingProfileIds = new Set((existingDrivers ?? []).map((d) => d.profile_id));

  // 3. Auto-sync: If a profile has role='driver', ensure record exists in drivers table
  if (driverProfiles && driverProfiles.length > 0) {
    for (const p of driverProfiles) {
      if (!existingProfileIds.has(p.id)) {
        const cleanPhone = (p.phone || "").replace(/\D/g, "");
        const fallbackLicense = cleanPhone
          ? `OD-DL-${cleanPhone}`
          : `OD-DL-${p.id.slice(0, 8).toUpperCase()}`;

        try {
          await supabase.from("drivers").upsert(
            {
              profile_id: p.id,
              license_number: fallbackLicense,
              status: "active",
            },
            { onConflict: "profile_id", ignoreDuplicates: true }
          );
        } catch {
          // ignore
        }
      }
    }
  }

  // 4. Return all drivers with linked profile and bus data
  const { data, error } = await supabase
    .from("drivers")
    .select("*, profile:profiles ( full_name, phone, email ), bus:buses ( bus_number )")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Drivers query error, using fallback profile list:", error);
    return (driverProfiles ?? []).map((p) => ({
      id: p.id,
      profile_id: p.id,
      license_number: `OD-DL-${(p.phone || "").replace(/\D/g, "") || p.id.slice(0, 8).toUpperCase()}`,
      assigned_bus_id: null,
      status: "active",
      created_at: new Date().toISOString(),
      profile: { full_name: p.full_name, phone: p.phone, email: p.email },
      bus: null,
    })) as DriverRow[];
  }

  // Enrich with profile information if relation didn't return profile object
  const rows = ((data as any[]) ?? []).map((d) => {
    const prof = d.profile || profilesMap.get(d.profile_id);
    return {
      ...d,
      profile: prof ? { full_name: prof.full_name, phone: prof.phone, email: prof.email } : null,
    };
  });

  return rows as DriverRow[];
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

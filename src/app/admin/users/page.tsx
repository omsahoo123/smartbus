"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import type { Profile, UserRole } from "@/types/database";

// Admins promote a signed-up passenger to driver/admin here. Public signup
// always creates a "people" role (see (auth)/signup) -- this is the only
// place role escalation happens.
export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRoleChange(id: string, role: UserRole) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-ink">Users</h1>
      <DataTable
        loading={loading}
        rows={users}
        columns={[
          { header: "Name", cell: (u) => u.full_name },
          { header: "Email", cell: (u) => u.email },
          { header: "Phone", cell: (u) => u.phone },
          {
            header: "Role",
            cell: (u) => (
              <Select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}>
                <option value="people">Passenger</option>
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </Select>
            ),
          },
        ]}
        emptyLabel="No users yet."
      />
    </div>
  );
}

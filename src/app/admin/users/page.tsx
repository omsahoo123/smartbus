"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import type { Profile, UserRole } from "@/types/database";
import { Users, Bus, ArrowRightLeft, Shield } from "lucide-react";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"passengers" | "drivers">("passengers");
  const [promoting, setPromoting] = useState<string | null>(null);

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

  async function handlePromote(id: string) {
    setPromoting(id);
    await supabase.from("profiles").update({ role: "driver" as UserRole }).eq("id", id);
    await load();
    setPromoting(null);
  }

  async function handleDemote(id: string) {
    if (!confirm("Demote this driver back to passenger? Their driver record (license, bus assignment) will remain but they won't be able to access the driver dashboard.")) return;
    setPromoting(id);
    await supabase.from("profiles").update({ role: "people" as UserRole }).eq("id", id);
    await load();
    setPromoting(null);
  }

  const passengers = users.filter((u) => u.role === "people");
  const drivers = users.filter((u) => u.role === "driver");
  const admins = users.filter((u) => u.role === "admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Users</h1>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-semibold text-ink">{users.length}</span> total users
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-bg p-1 border border-line">
        <button
          onClick={() => setTab("passengers")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "passengers"
              ? "bg-surface text-primary shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Passengers</span>
          <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            tab === "passengers" ? "bg-primary/10 text-primary" : "bg-bg text-muted"
          }`}>
            {passengers.length}
          </span>
        </button>
        <button
          onClick={() => setTab("drivers")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === "drivers"
              ? "bg-surface text-accent-dark shadow-sm"
              : "text-muted hover:text-ink"
          }`}
        >
          <Bus className="h-4 w-4" />
          <span>Drivers</span>
          <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            tab === "drivers" ? "bg-accent/20 text-accent-dark" : "bg-bg text-muted"
          }`}>
            {drivers.length}
          </span>
        </button>
      </div>

      {/* Passengers Tab */}
      {tab === "passengers" && (
        <DataTable
          loading={loading}
          rows={passengers}
          emptyLabel="No passengers yet."
          columns={[
            { header: "Name", cell: (u) => u.full_name ?? "—" },
            { header: "Phone", cell: (u) => u.phone ?? "—" },
            { header: "Email", cell: (u) => u.email ?? "—" },
            {
              header: "Joined",
              cell: (u) => new Date(u.created_at).toLocaleDateString(),
            },
            {
              header: "",
              cell: (u) => (
                <Button
                  variant="secondary"
                  onClick={() => handlePromote(u.id)}
                  disabled={promoting === u.id}
                  className="flex items-center gap-1.5 text-xs py-1.5 px-3"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>{promoting === u.id ? "Promoting..." : "Promote to Driver"}</span>
                </Button>
              ),
            },
          ]}
        />
      )}

      {/* Drivers Tab */}
      {tab === "drivers" && (
        <DataTable
          loading={loading}
          rows={drivers}
          emptyLabel="No drivers yet. Promote a passenger from the Passengers tab."
          columns={[
            { header: "Name", cell: (u) => u.full_name ?? "—" },
            { header: "Phone", cell: (u) => u.phone ?? "—" },
            { header: "Email", cell: (u) => u.email ?? "—" },
            {
              header: "Joined",
              cell: (u) => new Date(u.created_at).toLocaleDateString(),
            },
            {
              header: "",
              cell: (u) => (
                <button
                  onClick={() => handleDemote(u.id)}
                  disabled={promoting === u.id}
                  className="text-xs text-danger hover:underline disabled:opacity-50"
                >
                  {promoting === u.id ? "Demoting..." : "Demote to Passenger"}
                </button>
              ),
            },
          ]}
        />
      )}

      {/* Admins note */}
      {admins.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted mb-2">
            <Shield className="h-3.5 w-3.5" />
            <span>Administrators ({admins.length})</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {admins.map((a) => (
              <div key={a.id} className="rounded-lg bg-bg border border-line px-3 py-2 text-xs">
                <span className="font-medium text-ink">{a.full_name ?? a.email ?? "Admin"}</span>
                <span className="ml-2 text-muted">{a.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

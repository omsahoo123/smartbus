"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { Profile, UserRole } from "@/types/database";
import { Users, Bus, ArrowRight, ShieldCheck, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"passengers" | "drivers" | "admins">("passengers");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Promote a Passenger to Driver
  async function handlePromoteToDriver(user: Profile) {
    setActionLoading(user.id);
    setSuccessMsg(null);

    try {
      // 1. Update role in profiles
      await supabase.from("profiles").update({ role: "driver" as UserRole }).eq("id", user.id);

      // 2. Ensure driver record exists in drivers table
      const cleanPhone = (user.phone || "").replace(/\D/g, "");
      const license = cleanPhone ? `OD-DL-${cleanPhone}` : `OD-DL-${user.id.slice(0, 8).toUpperCase()}`;

      await supabase.from("drivers").insert({
        profile_id: user.id,
        license_number: license,
        status: "active",
      }).catch(() => {});

      setSuccessMsg(`${user.full_name || user.email} has been promoted to Driver and added to Fleet Drivers.`);
      await loadUsers();
      setActiveTab("drivers");
    } catch (err: any) {
      alert(err?.message || "Failed to promote user to driver");
    } finally {
      setActionLoading(null);
    }
  }

  // Demote Driver to Passenger
  async function handleDemoteToPassenger(user: Profile) {
    if (!confirm(`Demote ${user.full_name || "this driver"} back to Passenger?`)) return;

    setActionLoading(user.id);
    setSuccessMsg(null);

    try {
      await supabase.from("profiles").update({ role: "people" as UserRole }).eq("id", user.id);
      await supabase.from("drivers").delete().eq("profile_id", user.id).catch(() => {});

      setSuccessMsg(`${user.full_name || user.email} has been moved back to Passengers.`);
      await loadUsers();
    } catch (err: any) {
      alert(err?.message || "Failed to demote driver");
    } finally {
      setActionLoading(null);
    }
  }

  // Direct role changer for flexibility
  async function handleRoleChange(user: Profile, newRole: UserRole) {
    setActionLoading(user.id);
    try {
      await supabase.from("profiles").update({ role: newRole }).eq("id", user.id);
      if (newRole === "driver") {
        const cleanPhone = (user.phone || "").replace(/\D/g, "");
        const license = cleanPhone ? `OD-DL-${cleanPhone}` : `OD-DL-${user.id.slice(0, 8).toUpperCase()}`;
        await supabase.from("drivers").insert({
          profile_id: user.id,
          license_number: license,
          status: "active",
        }).catch(() => {});
      } else if (newRole === "people") {
        await supabase.from("drivers").delete().eq("profile_id", user.id).catch(() => {});
      }
      await loadUsers();
    } catch (err: any) {
      alert(err?.message || "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  }

  const passengers = users.filter((u) => u.role === "people");
  const drivers = users.filter((u) => u.role === "driver");
  const admins = users.filter((u) => u.role === "admin");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>User Directory & Access Roles</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Users Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Manage registered passengers, promote drivers to fleet operations, and view system administrators.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted bg-surface border border-line px-3 py-2 rounded-xl">
          <span>Total registered users:</span>
          <span className="font-bold text-ink">{users.length}</span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Sub-Section Navigation Tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-bg p-1.5 border border-line">
        {/* Passengers Sub-Section Tab */}
        <button
          type="button"
          onClick={() => { setActiveTab("passengers"); setSuccessMsg(null); }}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold transition ${
            activeTab === "passengers"
              ? "bg-surface text-primary shadow-sm border border-line/60"
              : "text-muted hover:text-ink hover:bg-surface/50"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Passengers</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              activeTab === "passengers"
                ? "bg-primary/10 text-primary"
                : "bg-muted/10 text-muted"
            }`}
          >
            {passengers.length}
          </span>
        </button>

        {/* Drivers Sub-Section Tab */}
        <button
          type="button"
          onClick={() => { setActiveTab("drivers"); setSuccessMsg(null); }}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold transition ${
            activeTab === "drivers"
              ? "bg-surface text-accent-dark shadow-sm border border-line/60"
              : "text-muted hover:text-ink hover:bg-surface/50"
          }`}
        >
          <Bus className="h-4 w-4" />
          <span>Drivers</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              activeTab === "drivers"
                ? "bg-accent/20 text-accent-dark"
                : "bg-muted/10 text-muted"
            }`}
          >
            {drivers.length}
          </span>
        </button>

        {/* Admins Sub-Section Tab */}
        <button
          type="button"
          onClick={() => { setActiveTab("admins"); setSuccessMsg(null); }}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-semibold transition ${
            activeTab === "admins"
              ? "bg-surface text-ink shadow-sm border border-line/60"
              : "text-muted hover:text-ink hover:bg-surface/50"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Admins</span>
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              activeTab === "admins"
                ? "bg-ink/10 text-ink"
                : "bg-muted/10 text-muted"
            }`}
          >
            {admins.length}
          </span>
        </button>
      </div>

      {/* PASSENGERS SUB-SECTION */}
      {activeTab === "passengers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted">
              These are regular commuters who can book bus seats and purchase daily/weekly passes.
            </p>
          </div>

          <DataTable
            loading={loading}
            rows={passengers}
            emptyLabel="No registered passenger accounts found."
            columns={[
              {
                header: "Passenger Name",
                cell: (u) => (
                  <div>
                    <p className="font-semibold text-ink">{u.full_name || "Unnamed Passenger"}</p>
                    <p className="text-[11px] text-muted">{u.email || "No email"}</p>
                  </div>
                ),
              },
              {
                header: "Phone Number",
                cell: (u) => <span className="font-mono text-xs text-ink">{u.phone || "—"}</span>,
              },
              {
                header: "Registered On",
                cell: (u) => (
                  <span className="text-xs text-muted">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </span>
                ),
              },
              {
                header: "Current Role",
                cell: (u) => (
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Passenger
                  </span>
                ),
              },
              {
                header: "Action",
                cell: (u) => (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={actionLoading === u.id}
                    onClick={() => handlePromoteToDriver(u)}
                    className="flex items-center gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>{actionLoading === u.id ? "Promoting..." : "Promote to Driver"}</span>
                  </Button>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* DRIVERS SUB-SECTION */}
      {activeTab === "drivers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted">
              These users have driver access privileges. Visit <strong>Fleet &gt; Drivers</strong> to link their commercial license and assign their bus.
            </p>
            <Link
              href="/admin/drivers"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark hover:underline"
            >
              <span>Go to Fleet &gt; Drivers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <DataTable
            loading={loading}
            rows={drivers}
            emptyLabel="No drivers currently found. Promote a passenger from the Passengers tab to make them a driver."
            columns={[
              {
                header: "Driver Name",
                cell: (u) => (
                  <div>
                    <p className="font-semibold text-ink">{u.full_name || "Unnamed Driver"}</p>
                    <p className="text-[11px] text-muted">{u.email || "No email"}</p>
                  </div>
                ),
              },
              {
                header: "Phone Number",
                cell: (u) => <span className="font-mono text-xs text-ink">{u.phone || "—"}</span>,
              },
              {
                header: "Status",
                cell: () => (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    Active Driver
                  </span>
                ),
              },
              {
                header: "Fleet Management",
                cell: () => (
                  <Link
                    href="/admin/drivers"
                    className="inline-flex items-center gap-1 rounded-lg bg-surface border border-line px-2.5 py-1 text-xs font-medium text-ink hover:border-accent hover:text-accent-dark transition shadow-sm"
                  >
                    <span>Assign Bus & License</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ),
              },
              {
                header: "Action",
                cell: (u) => (
                  <button
                    type="button"
                    disabled={actionLoading === u.id}
                    onClick={() => handleDemoteToPassenger(u)}
                    className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                  >
                    {actionLoading === u.id ? "Demoting..." : "Demote to Passenger"}
                  </button>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* ADMINS SUB-SECTION */}
      {activeTab === "admins" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted">
              Users with full administrator privileges across routes, fleet, timetables, and system settings.
            </p>
          </div>

          <DataTable
            loading={loading}
            rows={admins}
            emptyLabel="No administrators found."
            columns={[
              {
                header: "Admin Name",
                cell: (u) => (
                  <div>
                    <p className="font-semibold text-ink">{u.full_name || "System Administrator"}</p>
                    <p className="text-[11px] text-muted">{u.email || "No email"}</p>
                  </div>
                ),
              },
              {
                header: "Phone Number",
                cell: (u) => <span className="font-mono text-xs text-ink">{u.phone || "—"}</span>,
              },
              {
                header: "Role",
                cell: () => (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Administrator</span>
                  </span>
                ),
              },
              {
                header: "Account Created",
                cell: (u) => (
                  <span className="text-xs text-muted">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

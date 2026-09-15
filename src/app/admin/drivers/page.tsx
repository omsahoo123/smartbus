"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import {
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  listUnassignedDriverProfiles,
  type DriverRow,
} from "@/services/drivers";
import { listBuses } from "@/services/buses";
import type { Bus } from "@/types/database";

export default function AdminDriversPage() {
  const supabase = createClient();
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [unassignedProfiles, setUnassignedProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRow | null>(null);

  // Form state
  const [profileId, setProfileId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [assignedBusId, setAssignedBusId] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [drvList, busList, unassigned] = await Promise.all([
        listDrivers(supabase),
        listBuses(supabase),
        listUnassignedDriverProfiles(supabase),
      ]);
      setDrivers(drvList);
      setBuses(busList);
      setUnassignedProfiles(unassigned);
    } catch (err: any) {
      setError(err?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingDriver(null);
    setProfileId(unassignedProfiles[0]?.id || "");
    setLicenseNumber("");
    setAssignedBusId("");
    setStatus("active");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(d: DriverRow) {
    setEditingDriver(d);
    setProfileId(d.profile_id);
    setLicenseNumber(d.license_number);
    setAssignedBusId(d.assigned_bus_id || "");
    setStatus(d.status);
    setError(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingDriver) {
        await updateDriver(supabase, editingDriver.id, {
          license_number: licenseNumber.trim(),
          assigned_bus_id: assignedBusId || null,
          status,
        });
      } else {
        if (!profileId) {
          setError("Please select a user profile to register as a driver.");
          setSaving(false);
          return;
        }
        await createDriver(supabase, {
          profile_id: profileId,
          license_number: licenseNumber.trim(),
          assigned_bus_id: assignedBusId || null,
          status,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save driver");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this driver record?")) return;
    try {
      await deleteDriver(supabase, id);
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to delete driver");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Drivers Management</h1>
          <p className="text-xs sm:text-sm text-muted">
            Assign bus fleet and commercial driving licenses to verified drivers.
          </p>
        </div>
        <Button onClick={openCreate}>+ Register Driver</Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Loading fleet drivers...</div>
      ) : (
        <DataTable
          rows={drivers}
          columns={[
            {
              header: "Driver Name",
              cell: (d) => (
                <div>
                  <p className="font-semibold text-ink">{d.profile?.full_name || "Unnamed Driver"}</p>
                  <p className="text-xs text-muted">{d.profile?.email || ""}</p>
                </div>
              ),
            },
            { header: "Phone", cell: (d) => d.profile?.phone || "—" },
            { header: "License Number", cell: (d) => <span className="font-mono font-medium text-ink">{d.license_number}</span> },
            {
              header: "Assigned Bus",
              cell: (d) =>
                d.bus ? (
                  <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                    {d.bus.bus_number}
                  </span>
                ) : (
                  <span className="text-xs text-muted">Unassigned</span>
                ),
            },
            {
              header: "Status",
              cell: (d) => (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    d.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {d.status}
                </span>
              ),
            },
            {
              header: "Actions",
              cell: (d) => (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                    Edit / Assign Bus
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => handleDelete(d.id)}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          emptyLabel="No registered drivers found. First promote a user from Users -> Passengers to Driver, then register their license here."
        />
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDriver ? "Edit Driver & Bus Assignment" : "Register Driver"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
              {error}
            </div>
          )}

          {!editingDriver ? (
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Select User Profile (Driver Role)
              </label>
              {unassignedProfiles.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  No unassigned driver profiles available. Go to <strong>Users</strong> and promote a user to driver first.
                </p>
              ) : (
                <Select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  options={unassignedProfiles.map((p) => ({
                    value: p.id,
                    label: `${p.full_name || p.email} (${p.phone || "No phone"})`,
                  }))}
                />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Driver
              </label>
              <p className="text-sm font-semibold text-ink">
                {editingDriver.profile?.full_name} ({editingDriver.profile?.phone || editingDriver.profile?.email})
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Commercial License Number
            </label>
            <Input
              required
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="e.g. OD-02-2024-DRV101"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Assigned Bus
            </label>
            <Select
              value={assignedBusId}
              onChange={(e) => setAssignedBusId(e.target.value)}
              options={[
                { value: "", label: "— No Bus Assigned (Standby) —" },
                ...buses.map((b) => ({
                  value: b.id,
                  label: `${b.bus_number} (${b.bus_type} • ${b.capacity} seats)`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Driver Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "on_leave", label: "On Leave" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || (!editingDriver && unassignedProfiles.length === 0)}>
              {saving ? "Saving..." : editingDriver ? "Save Changes" : "Register Driver"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

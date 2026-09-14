"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  listTrips,
  createTrip,
  assignDriverToTrip,
  updateTripStatus,
  deleteTrip,
  type TripRow,
} from "@/services/trips";
import { listDrivers, type DriverRow } from "@/services/drivers";
import { listRoutes } from "@/services/routes";
import { listBuses } from "@/services/buses";
import type { Route, Bus } from "@/types/database";

export default function AdminTripsPage() {
  const supabase = createClient();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripRow | null>(null);

  // Form states for Create Trip
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("scheduled");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [tList, dList, rList, bList] = await Promise.all([
        listTrips(supabase),
        listDrivers(supabase),
        listRoutes(supabase),
        listBuses(supabase),
      ]);
      setTrips(tList);
      setDrivers(dList);
      setRoutes(rList);
      setBuses(bList);
    } catch (err: any) {
      setError(err?.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setRouteId(routes[0]?.id || "");
    setBusId(buses[0]?.id || "");
    setDriverId("");
    setTripDate(new Date().toISOString().slice(0, 10));
    setStatus("scheduled");
    setError(null);
    setModalOpen(true);
  }

  function openAssignDriver(trip: TripRow) {
    setSelectedTrip(trip);
    setDriverId(trip.driver_id || "");
    setError(null);
    setAssignModalOpen(true);
  }

  async function handleCreateTrip(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTrip(supabase, {
        route_id: routeId,
        bus_id: busId,
        driver_id: driverId || null,
        trip_date: tripDate,
        status,
      });
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to create trip");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDriverAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTrip) return;
    setSaving(true);
    setError(null);
    try {
      await assignDriverToTrip(supabase, selectedTrip.id, driverId || null);
      setAssignModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to assign driver");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(tripId: string, newStatus: any) {
    try {
      await updateTripStatus(supabase, tripId, newStatus);
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to update trip status");
    }
  }

  async function handleDeleteTrip(id: string) {
    if (!confirm("Are you sure you want to delete this trip?")) return;
    try {
      await deleteTrip(supabase, id);
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to delete trip");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Trips & Driver Assignment</h1>
          <p className="text-xs sm:text-sm text-muted">
            Manage operational bus trips, assign duty drivers, and update live service status.
          </p>
        </div>
        <Button onClick={openCreate}>+ Schedule New Trip</Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Loading trips...</div>
      ) : (
        <DataTable
          rows={trips}
          columns={[
            {
              header: "Date",
              cell: (t) => (
                <div>
                  <p className="font-mono text-xs font-semibold text-ink">{t.trip_date}</p>
                  <p className="text-[11px] text-muted">
                    {t.trip_date === new Date().toISOString().slice(0, 10) ? "Today" : ""}
                  </p>
                </div>
              ),
            },
            {
              header: "Route",
              cell: (t) => (
                <div>
                  <p className="font-semibold text-ink">{t.route?.route_name || "Unknown Route"}</p>
                  <p className="text-xs text-muted">
                    {t.route?.source} &rarr; {t.route?.destination}
                  </p>
                </div>
              ),
            },
            {
              header: "Bus",
              cell: (t) => (
                <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                  {t.bus?.bus_number}
                </span>
              ),
            },
            {
              header: "Assigned Driver",
              cell: (t) =>
                t.driver ? (
                  <div>
                    <p className="text-xs font-semibold text-ink">{t.driver.profile?.full_name}</p>
                    <p className="font-mono text-[11px] text-muted">{t.driver.profile?.phone || t.driver.license_number}</p>
                  </div>
                ) : (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    No Driver Assigned
                  </span>
                ),
            },
            {
              header: "Status",
              cell: (t) => (
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    className="rounded border border-line bg-surface text-xs p-1 text-ink"
                  >
                    <option value="scheduled">scheduled</option>
                    <option value="running">running</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              ),
            },
            {
              header: "Actions",
              cell: (t) => (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openAssignDriver(t)}>
                    Assign Driver
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => handleDeleteTrip(t.id)}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          emptyLabel="No trips found. Click '+ Schedule New Trip' to create one."
        />
      )}

      {/* Modal: Schedule New Trip */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule New Trip">
        <form onSubmit={handleCreateTrip} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Select Route
            </label>
            <Select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              options={routes.map((r) => ({
                value: r.id,
                label: `${r.route_name} (${r.source} → ${r.destination})`,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Select Bus
            </label>
            <Select
              value={busId}
              onChange={(e) => setBusId(e.target.value)}
              options={buses.map((b) => ({
                value: b.id,
                label: `${b.bus_number} (${b.bus_type} • ${b.capacity} seats)`,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Assign Driver (Optional)
            </label>
            <Select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              options={[
                { value: "", label: "— No Driver (Assign Later) —" },
                ...drivers.map((d) => ({
                  value: d.id,
                  label: `${d.profile?.full_name || "Driver"} (${d.profile?.phone || d.license_number})`,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Trip Date
              </label>
              <Input
                type="date"
                required
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Initial Status
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "scheduled", label: "Scheduled" },
                  { value: "running", label: "Running" },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Scheduling..." : "Create Trip"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Driver */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Driver to Trip"
      >
        <form onSubmit={handleSaveDriverAssignment} className="space-y-4">
          {selectedTrip && (
            <div className="rounded-xl bg-bg p-3 border border-line text-xs space-y-1">
              <p>
                <strong>Route:</strong> {selectedTrip.route?.route_name}
              </p>
              <p>
                <strong>Bus:</strong> {selectedTrip.bus?.bus_number}
              </p>
              <p>
                <strong>Date:</strong> {selectedTrip.trip_date}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Select Fleet Driver
            </label>
            <Select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              options={[
                { value: "", label: "— Unassign Driver —" },
                ...drivers.map((d) => ({
                  value: d.id,
                  label: `${d.profile?.full_name || "Driver"} (${d.profile?.phone || d.license_number}) ${
                    d.assigned_bus_id === selectedTrip?.bus_id ? "★ Bus Match" : ""
                  }`,
                })),
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Driver Assignment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

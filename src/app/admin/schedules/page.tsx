"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type ScheduleRow,
} from "@/services/schedules";
import { listRoutes } from "@/services/routes";
import { listBuses } from "@/services/buses";
import type { Route, Bus } from "@/types/database";

export default function AdminSchedulesPage() {
  const supabase = createClient();
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRow | null>(null);
  const [routeId, setRouteId] = useState("");
  const [busId, setBusId] = useState("");
  const [departureTime, setDepartureTime] = useState("08:00");
  const [arrivalTime, setArrivalTime] = useState("09:30");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sList, rList, bList] = await Promise.all([
        listSchedules(supabase),
        listRoutes(supabase),
        listBuses(supabase),
      ]);
      setSchedules(sList);
      setRoutes(rList);
      setBuses(bList);
    } catch (err: any) {
      setError(err?.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingSchedule(null);
    setRouteId(routes[0]?.id || "");
    setBusId(buses[0]?.id || "");
    setDepartureTime("08:00");
    setArrivalTime("09:30");
    setStatus("active");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: ScheduleRow) {
    setEditingSchedule(s);
    setRouteId(s.route_id);
    setBusId(s.bus_id);
    setDepartureTime(s.departure_time);
    setArrivalTime(s.arrival_time);
    setStatus(s.status);
    setError(null);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingSchedule) {
        await updateSchedule(supabase, editingSchedule.id, {
          route_id: routeId,
          bus_id: busId,
          departure_time: departureTime,
          arrival_time: arrivalTime,
          status,
        });
      } else {
        await createSchedule(supabase, {
          route_id: routeId,
          bus_id: busId,
          departure_time: departureTime,
          arrival_time: arrivalTime,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
          status,
        });
      }
      setModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await deleteSchedule(supabase, id);
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to delete schedule");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Bus Service Schedules</h1>
          <p className="text-xs sm:text-sm text-muted">
            Configure recurring timetables, bus linkages, and scheduled departure/arrival slots.
          </p>
        </div>
        <Button onClick={openCreate}>+ Add Schedule</Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Loading schedules...</div>
      ) : (
        <DataTable
          rows={schedules}
          columns={[
            {
              header: "Route",
              cell: (s) => (
                <div>
                  <p className="font-semibold text-ink">{s.route?.route_name || "Route"}</p>
                  <p className="text-xs text-muted">
                    {s.route?.source} &rarr; {s.route?.destination}
                  </p>
                </div>
              ),
            },
            {
              header: "Bus",
              cell: (s) => (
                <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                  {s.bus?.bus_number}
                </span>
              ),
            },
            {
              header: "Timetable",
              cell: (s) => (
                <div className="font-mono text-xs text-ink">
                  <span>{s.departure_time}</span> &rarr; <span>{s.arrival_time}</span>
                </div>
              ),
            },
            {
              header: "Days of Week",
              cell: () => <span className="text-xs text-muted">Daily (Mon-Sun)</span>,
            },
            {
              header: "Status",
              cell: (s) => (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    s.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {s.status}
                </span>
              ),
            },
            {
              header: "Actions",
              cell: (s) => (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => handleDelete(s.id)}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          emptyLabel="No schedules found. Click '+ Add Schedule' to create one."
        />
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSchedule ? "Edit Schedule" : "Add New Schedule"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Route
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
              Bus
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Departure Time
              </label>
              <Input
                type="time"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
                Arrival Time
              </label>
              <Input
                type="time"
                required
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingSchedule ? "Save Changes" : "Create Schedule"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

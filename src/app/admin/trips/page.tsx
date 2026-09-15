"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  autoAssignDriversForDates,
  type TripRow,
  type AutoAssignResult,
} from "@/services/trips";
import { listDrivers, type DriverRow } from "@/services/drivers";
import { listRoutes } from "@/services/routes";
import { listBuses } from "@/services/buses";
import type { Route, Bus } from "@/types/database";
import {
  Calendar,
  Sparkles,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bus as BusIcon,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function AdminTripsPage() {
  const supabase = createClient();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<"all" | "today" | "tomorrow">("all");
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

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

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const load = useCallback(async () => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Group trips by date
  const groupedTrips = useMemo(() => {
    const map = new Map<string, TripRow[]>();
    for (const trip of trips) {
      if (!map.has(trip.trip_date)) {
        map.set(trip.trip_date, []);
      }
      map.get(trip.trip_date)!.push(trip);
    }

    // Sort dates in logical order: Today first, Tomorrow next, then future dates ascending, past dates descending
    const allDates = Array.from(map.keys()).sort((a, b) => {
      if (a === todayStr) return -1;
      if (b === todayStr) return 1;
      if (a === tomorrowStr) return -1;
      if (b === tomorrowStr) return 1;
      return b.localeCompare(a);
    });

    return allDates.map((date) => {
      const dayTrips = map.get(date)!;
      // Sort trips within each date by schedule departure time
      dayTrips.sort((a, b) => {
        const timeA = a.schedule?.departure_time || "";
        const timeB = b.schedule?.departure_time || "";
        if (timeA && timeB) return timeA.localeCompare(timeB);
        return (a.bus?.bus_number || "").localeCompare(b.bus?.bus_number || "");
      });

      const totalCount = dayTrips.length;
      const assignedCount = dayTrips.filter((t) => !!t.driver_id).length;
      const unassignedCount = totalCount - assignedCount;

      let labelTag = "Scheduled";
      if (date === todayStr) labelTag = "Today";
      else if (date === tomorrowStr) labelTag = "Tomorrow";
      else if (date < todayStr) labelTag = "Past";

      let formattedDate = date;
      try {
        const parsed = new Date(date + "T00:00:00");
        formattedDate = parsed.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        // fallback
      }

      return {
        date,
        formattedDate,
        labelTag,
        trips: dayTrips,
        totalCount,
        assignedCount,
        unassignedCount,
      };
    });
  }, [trips, todayStr, tomorrowStr]);

  // Filtered groups based on tab selection
  const visibleGroups = useMemo(() => {
    if (selectedFilter === "today") {
      return groupedTrips.filter((g) => g.date === todayStr);
    }
    if (selectedFilter === "tomorrow") {
      return groupedTrips.filter((g) => g.date === tomorrowStr);
    }
    return groupedTrips;
  }, [groupedTrips, selectedFilter, todayStr, tomorrowStr]);

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
      setBanner({
        type: "success",
        message: `Trip successfully created for ${tripDate}.`,
      });
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
      setBanner({
        type: "success",
        message: "Driver assignment updated successfully.",
      });
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
      setBanner({
        type: "info",
        message: "Trip deleted.",
      });
    } catch (err: any) {
      alert(err?.message || "Failed to delete trip");
    }
  }

  // Auto-assign round-robin driver dispatch
  async function handleAutoAssign(targetDates?: string[]) {
    setAutoAssigning(true);
    setBanner(null);
    try {
      const result: AutoAssignResult = await autoAssignDriversForDates(supabase, {
        dates: targetDates,
        overwriteExisting: false,
      });

      await load();

      if (result.assignedCount > 0) {
        setBanner({
          type: "success",
          message: `Auto-assignment complete: Assigned ${result.assignedCount} trips across ${result.assignedBusCount} buses using multi-driver round-robin rotation!`,
        });
      } else {
        setBanner({
          type: "info",
          message: "All scheduled trips for these dates already have rostered drivers assigned, or no drivers are currently assigned to those buses in Drivers Management.",
        });
      }
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err?.message || "Failed to run automated driver assignment",
      });
    } finally {
      setAutoAssigning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Trips & Driver Assignment</h1>
          <p className="text-xs sm:text-sm text-muted">
            Manage operational trips organized by date, assign duty drivers, or auto-dispatch rostered drivers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button onClick={openCreate} className="text-xs sm:text-sm">
            + Schedule New Trip
          </Button>
        </div>
      </div>

      {/* Banner Notification */}
      {banner && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs sm:text-sm border transition-all ${banner.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : banner.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
        >
          <div className="flex items-center gap-2.5">
            {banner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : banner.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
            )}
            <span>{banner.message}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-semibold underline hover:opacity-75 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedFilter === "all"
              ? "bg-primary text-white shadow-sm"
              : "bg-surface text-muted hover:bg-bg border border-line"
              }`}
          >
            All Dates ({trips.length} trips)
          </button>
          <button
            onClick={() => setSelectedFilter("today")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedFilter === "today"
              ? "bg-primary text-white shadow-sm"
              : "bg-surface text-muted hover:bg-bg border border-line"
              }`}
          >
            Today ({trips.filter((t) => t.trip_date === todayStr).length})
          </button>
          <button
            onClick={() => setSelectedFilter("tomorrow")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedFilter === "tomorrow"
              ? "bg-primary text-white shadow-sm"
              : "bg-surface text-muted hover:bg-bg border border-line"
              }`}
          >
            Tomorrow ({trips.filter((t) => t.trip_date === tomorrowStr).length})
          </button>
        </div>

        <div className="text-xs text-muted hidden sm:block">
          Showing <span className="font-semibold text-ink">{visibleGroups.length}</span> date sections
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted">Loading scheduled trips and drivers...</div>
      ) : visibleGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center text-sm text-muted space-y-3">
          <Calendar className="h-8 w-8 mx-auto text-muted/60" />
          <p className="font-semibold text-ink">No trips found for the selected filter.</p>
          <p className="text-xs">
            Use &quot;+ Schedule New Trip&quot; above to plan new operational bus routes.
          </p>
        </div>
      ) : (
        /* Date Group Sections */
        <div className="space-y-8">
          {visibleGroups.map((group) => (
            <div
              key={group.date}
              className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm shadow-black/[0.02]"
            >
              {/* Date Header Card */}
              <div className="bg-primary-light/40 border-b border-line px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base font-bold text-ink">
                        {group.date}
                      </h2>
                      <span className="text-xs text-muted">• {group.formattedDate}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${group.labelTag === "Today"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : group.labelTag === "Tomorrow"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-ink/5 text-muted border border-line"
                          }`}
                      >
                        {group.labelTag}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side summary & action */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-ink bg-surface px-2.5 py-1 rounded-lg border border-line">
                      {group.totalCount} {group.totalCount === 1 ? "Trip" : "Trips"}
                    </span>
                    {group.unassignedCount > 0 ? (
                      <span className="rounded-lg bg-amber-50 px-2.5 py-1 font-medium text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        {group.unassignedCount} Unassigned
                      </span>
                    ) : (
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-emerald-600" />
                        All Drivers Assigned
                      </span>
                    )}
                  </div>

                  {group.unassignedCount > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAutoAssign([group.date])}
                      disabled={autoAssigning}
                      className="text-xs py-1 h-7 border-primary/40 text-primary hover:bg-primary/5"
                    >
                      Auto-Assign Driver
                    </Button>
                  )}
                </div>
              </div>

              {/* Table for this Date */}
              <div className="p-4 sm:p-5">
                <DataTable
                  rows={group.trips}
                  columns={[
                    {
                      header: "Route",
                      cell: (t) => (
                        <div>
                          <p className="font-semibold text-ink text-sm">
                            {t.route?.route_name || "Daily Route"}
                          </p>
                          <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                            <span>{t.route?.source}</span>
                            <span>&rarr;</span>
                            <span>{t.route?.destination}</span>
                          </p>
                        </div>
                      ),
                    },
                    {
                      header: "Departure",
                      cell: (t) => (
                        <div className="flex items-center gap-1.5 font-mono text-xs text-ink font-semibold">
                          <Clock className="h-3.5 w-3.5 text-muted" />
                          <span>{t.schedule?.departure_time || "Scheduled"}</span>
                        </div>
                      ),
                    },
                    {
                      header: "Bus",
                      cell: (t) => (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                          <BusIcon className="h-3 w-3" />
                          {t.bus?.bus_number}
                        </span>
                      ),
                    },
                    {
                      header: "Assigned Driver",
                      cell: (t) =>
                        t.driver ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-ink">
                              {t.driver.profile?.full_name || "Assigned Driver"}
                            </p>
                            <p className="font-mono text-[11px] text-muted">
                              {t.driver.profile?.phone || t.driver.license_number}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                            <AlertCircle className="h-3 w-3" />
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
                            className="rounded-lg border border-line bg-surface text-xs p-1 text-ink focus:outline-none focus:ring-1 focus:ring-primary"
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-semibold text-primary hover:bg-primary/10"
                            onClick={() => openAssignDriver(t)}
                          >
                            {t.driver ? "Change Driver" : "Assign Driver"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-semibold text-danger hover:bg-danger/10"
                            onClick={() => handleDeleteTrip(t.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  emptyLabel="No trips found for this date."
                />
              </div>
            </div>
          ))}
        </div>
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
              Bus Fleet Vehicle
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
              Trip Date
            </label>
            <Input
              type="date"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Duty Driver (Optional)
            </label>
            <Select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              options={[
                { value: "", label: "— Leave Unassigned (Can Auto-Assign later) —" },
                ...drivers.map((d) => ({
                  value: d.id,
                  label: `${d.profile?.full_name || "Driver"} (${d.profile?.phone || d.license_number}) ${d.assigned_bus_id === busId ? "★ Designated Bus Driver" : ""
                    }`,
                })),
              ]}
            />

          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: "scheduled", label: "Scheduled" },
                { value: "running", label: "Running" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
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

      {/* Modal: Assign / Change Driver for specific Trip */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign or Change Duty Driver"
      >
        <form onSubmit={handleSaveDriverAssignment} className="space-y-4">
          {selectedTrip && (
            <div className="rounded-xl bg-bg p-3.5 border border-line text-xs space-y-1.5">
              <div className="flex justify-between items-center pb-1.5 border-b border-line">
                <span className="text-muted">Trip Date:</span>
                <span className="font-mono font-bold text-ink">{selectedTrip.trip_date}</span>
              </div>
              <p>
                <strong>Route:</strong> {selectedTrip.route?.route_name} ({selectedTrip.route?.source} &rarr; {selectedTrip.route?.destination})
              </p>
              <p>
                <strong>Vehicle:</strong> Bus {selectedTrip.bus?.bus_number}
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
                  label: `${d.profile?.full_name || "Driver"} (${d.profile?.phone || d.license_number}) ${d.assigned_bus_id === selectedTrip?.bus_id ? "★ Rostered Bus Driver" : ""
                    }`,
                })),
              ]}
            />
            <p className="text-[11px] text-muted mt-1">
              ★ Indicates drivers registered to this bus in Drivers Management. You can also assign any relief driver if the main driver is unavailable.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="button" variant="ghost" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update Driver Duty"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

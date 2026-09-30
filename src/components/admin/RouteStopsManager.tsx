"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { listStops } from "@/services/stops";
import {
  listRouteStops,
  addRouteStop,
  deleteRouteStop,
  reorderRouteStops,
} from "@/services/routes";
import type { RouteRow, Stop, RouteStop } from "@/types/database";
import type { MapPoint } from "@/components/maps/MapView";
import {
  MapPin,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Navigation,
  AlertCircle,
} from "lucide-react";

const MapView = dynamic(
  () => import("@/components/maps/MapView").then((m) => m.MapView),
  { ssr: false }
);

export function RouteStopsManager({
  route,
  open,
  onClose,
}: {
  route: RouteRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New stop form state
  const [selectedStopId, setSelectedStopId] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");

  const loadData = useCallback(async () => {
    if (!route) return;
    setLoading(true);
    setError(null);
    try {
      const [stopsList, availableStops] = await Promise.all([
        listRouteStops(supabase, route.id),
        listStops(supabase),
      ]);
      const formatted = (stopsList ?? []).map((rs: any) => ({
        ...rs,
        stop: Array.isArray(rs.stop) ? rs.stop[0] : rs.stop,
      }));
      setRouteStops(formatted as RouteStop[]);
      setAllStops(availableStops as Stop[]);
      if (availableStops.length > 0 && !selectedStopId) {
        setSelectedStopId(availableStops[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [route, supabase, selectedStopId]);

  useEffect(() => {
    if (open && route) {
      loadData();
    }
  }, [open, route, loadData]);

  async function handleAddStop(e: React.FormEvent) {
    e.preventDefault();
    if (!route || !selectedStopId) return;
    setSubmitting(true);
    setError(null);

    try {
      const nextSequence = routeStops.length > 0
        ? Math.max(...routeStops.map((s) => s.sequence)) + 1
        : 1;

      await addRouteStop(supabase, {
        route_id: route.id,
        stop_id: selectedStopId,
        sequence: nextSequence,
        arrival_time: arrivalTime ? `${arrivalTime}:00` : null,
        departure_time: departureTime ? `${departureTime}:00` : null,
      });

      setArrivalTime("");
      setDepartureTime("");
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStop(id: string) {
    if (!route) return;
    setError(null);
    try {
      await deleteRouteStop(supabase, id);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    if (!route) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= routeStops.length) return;

    const newOrder = [...routeStops];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setRouteStops(newOrder);

    try {
      const orderedIds = newOrder.map((s) => s.stop_id);
      await reorderRouteStops(supabase, route.id, orderedIds);
      await loadData();
    } catch (err: any) {
      setError(err.message);
      await loadData();
    }
  }

  if (!route) return null;

  // Convert route stops to MapPoint items for MapView
  const mapPoints: MapPoint[] = routeStops
    .filter((rs) => rs.stop && rs.stop.latitude && rs.stop.longitude)
    .map((rs, idx) => ({
      id: rs.id,
      lat: rs.stop!.latitude,
      lng: rs.stop!.longitude,
      label: rs.stop!.name,
      sequence: idx + 1,
      details: [
        rs.arrival_time ? `Arr: ${rs.arrival_time.slice(0, 5)}` : null,
        rs.departure_time ? `Dep: ${rs.departure_time.slice(0, 5)}` : null,
        rs.stop?.address,
      ].filter(Boolean).join(" • "),
    }));

  const mapCenter: [number, number] =
    mapPoints.length > 0
      ? [mapPoints[0].lat, mapPoints[0].lng]
      : [20.2961, 85.8245]; // Default to Bhubaneswar

  // Filter out stops that are already added to this route to prevent duplicates
  const existingStopIds = new Set(routeStops.map((rs) => rs.stop_id));
  const availableToAdd = allStops.filter((s) => !existingStopIds.has(s.id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Route Stoppages & Map: ${route.route_name}`}
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Route Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg p-3.5 border border-line text-xs">
          <div>
            <span className="font-semibold text-ink">Corridor: </span>
            <span className="text-primary font-bold">{route.source}</span> &rarr;{" "}
            <span className="text-primary font-bold">{route.destination}</span>
          </div>
          <div className="text-muted">
            Total Stops: <span className="font-bold text-ink">{routeStops.length}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/30 p-3 text-xs text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Route Map Preview */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-primary" />
              <span>Route Stoppage Map Path</span>
            </h3>
            <span className="text-[11px] text-muted">
              Numbered in chronological order of transit
            </span>
          </div>
          <div className="h-60 w-full overflow-hidden rounded-xl border border-line shadow-inner">
            <MapView
              center={mapCenter}
              stops={mapPoints}
              zoom={mapPoints.length > 0 ? 12 : 11}
            />
          </div>
        </div>

        {/* Current Stoppages Table / List */}
        <div>
          <h3 className="font-display text-sm font-bold text-ink mb-3">
            Ordered Stoppages
          </h3>

          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          ) : routeStops.length === 0 ? (
            <Card className="border-dashed p-6 text-center text-xs text-muted">
              No intermediate stops assigned to this route yet. Add stops using the form below.
            </Card>
          ) : (
            <div className="space-y-2">
              {routeStops.map((rs, idx) => (
                <div
                  key={rs.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 transition hover:border-primary/40 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-ink">{rs.stop?.name ?? "Unknown stop"}</p>
                      <p className="text-[11px] text-muted">
                        {rs.stop?.address || `${rs.stop?.latitude.toFixed(3)}, ${rs.stop?.longitude.toFixed(3)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-[11px] text-muted">
                      {rs.arrival_time && <div>Arr: <span className="font-medium text-ink">{rs.arrival_time.slice(0, 5)}</span></div>}
                      {rs.departure_time && <div>Dep: <span className="font-medium text-ink">{rs.departure_time.slice(0, 5)}</span></div>}
                      {!rs.arrival_time && !rs.departure_time && <span className="text-muted/60">—</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, "up")}
                        className="rounded p-1 hover:bg-bg disabled:opacity-30 text-muted hover:text-ink"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === routeStops.length - 1}
                        onClick={() => handleMove(idx, "down")}
                        className="rounded p-1 hover:bg-bg disabled:opacity-30 text-muted hover:text-ink"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStop(rs.id)}
                        className="rounded p-1 hover:bg-danger/10 text-danger"
                        title="Remove from Route"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Stoppage to Route Form */}
        <div className="rounded-xl border border-line bg-bg/50 p-4">
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-primary" />
            <span>Add Stoppage to Route</span>
          </h4>

          {availableToAdd.length === 0 ? (
            <p className="text-xs text-muted">
              All existing stops in the database are already assigned to this route. Create new stops in the &quot;Bus Stops&quot; admin tab first.
            </p>
          ) : (
            <form onSubmit={handleAddStop} className="space-y-3">
              <Select
                label="Select Bus Stop"
                required
                value={selectedStopId}
                onChange={(e) => setSelectedStopId(e.target.value)}
              >
                {availableToAdd.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.address ? `(${s.address})` : ""}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Est. Arrival Time"
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                />
                <Input
                  label="Est. Departure Time"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !selectedStopId}
                className="w-full text-xs"
              >
                {submitting ? "Adding stoppage..." : "Add Stoppage to Route"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}

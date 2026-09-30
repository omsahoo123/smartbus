"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { Card } from "@/components/ui/Card";
import { listStops, createStop, updateStop, deleteStop } from "@/services/stops";
import type { Stop } from "@/types/database";
import type { MapPoint } from "@/components/maps/MapView";
import { MapPin, Navigation, MousePointerClick, AlertCircle } from "lucide-react";

const MapView = dynamic(
  () => import("@/components/maps/MapView").then((m) => m.MapView),
  { ssr: false }
);

const EMPTY: Partial<Stop> = { name: "", address: "", latitude: 20.2961, longitude: 85.8245 };

export default function AdminStopsPage() {
  const supabase = createClient();
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Stop>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [selectedMapStop, setSelectedMapStop] = useState<Stop | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStops(await listStops(supabase));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing({ name: "", address: "", latitude: 20.2961, longitude: 85.8245 });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(s: Stop) {
    setEditing(s);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing.id) {
        await updateStop(supabase, editing.id, editing);
      } else {
        await createStop(supabase, editing);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this stop? Routes using it may be affected.")) return;
    await deleteStop(supabase, id);
    load();
  }

  function handleMapClick(lat: number, lng: number) {
    if (modalOpen) {
      setEditing((s) => ({
        ...s,
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
      }));
    }
  }

  const mapPoints: MapPoint[] = stops.map((s, idx) => ({
    id: s.id,
    lat: s.latitude,
    lng: s.longitude,
    label: s.name,
    sequence: idx + 1,
    details: s.address ?? undefined,
  }));

  const mapCenter: [number, number] =
    stops.length > 0
      ? [stops[0].latitude, stops[0].longitude]
      : [20.2961, 85.8245];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">Bus Stops & Geolocation</h1>
          <p className="text-xs text-muted">
            Manage physical transit stops, street addresses, and GPS coordinate pins.
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          <span>Add Stop</span>
        </Button>
      </div>

      {/* Map Overview of all stops */}
      <Card className="p-4 bg-surface shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold text-ink">City Bus Stops Map</h2>
          </div>
          <span className="text-[11px] text-muted">
            {stops.length} stops registered
          </span>
        </div>
        <div className="h-72 w-full overflow-hidden rounded-xl border border-line">
          <MapView
            center={mapCenter}
            stops={mapPoints}
            zoom={12}
            onStopClick={(p) => {
              const matched = stops.find((s) => s.id === p.id);
              if (matched) setSelectedMapStop(matched);
            }}
          />
        </div>
        {selectedMapStop && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-bg p-3 border border-line text-xs">
            <div>
              <span className="font-bold text-ink">{selectedMapStop.name}</span>
              <p className="text-muted text-[11px]">{selectedMapStop.address || "No address"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted text-[11px]">
                {selectedMapStop.latitude.toFixed(4)}, {selectedMapStop.longitude.toFixed(4)}
              </span>
              <Button variant="secondary" onClick={() => openEdit(selectedMapStop)} className="text-xs py-1 px-2.5">
                Edit
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Table of stops */}
      <DataTable
        loading={loading}
        rows={stops}
        emptyLabel="No stops yet. Add your first bus stop to get started."
        columns={[
          { header: "Name", cell: (s) => <span className="font-medium text-ink">{s.name}</span> },
          { header: "Address", cell: (s) => s.address ?? "—" },
          { header: "Latitude", cell: (s) => <span className="font-mono">{s.latitude.toFixed(4)}</span> },
          { header: "Longitude", cell: (s) => <span className="font-mono">{s.longitude.toFixed(4)}</span> },
          {
            header: "Actions",
            cell: (s) => (
              <div className="flex gap-3 text-xs">
                <button onClick={() => openEdit(s)} className="text-primary hover:underline">Edit</button>
                <button onClick={() => handleDelete(s.id)} className="text-danger hover:underline">Delete</button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing.id ? "Edit stop" : "Add stop"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Stop name"
            required
            value={editing.name ?? ""}
            onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
          />
          <Input
            label="Address"
            placeholder="e.g. Master Canteen Square, Unit 3"
            value={editing.address ?? ""}
            onChange={(e) => setEditing((s) => ({ ...s, address: e.target.value }))}
          />

          <div className="rounded-xl bg-bg p-3 border border-line text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-primary font-semibold">
              <MousePointerClick className="h-3.5 w-3.5" />
              <span>Interactive Coordinate Picker</span>
            </div>
            <p className="text-muted text-[11px]">
              Click on the map below to instantly pin the exact GPS coordinates.
            </p>
            <div className="h-44 w-full overflow-hidden rounded-lg border border-line">
              <MapView
                center={[editing.latitude ?? 20.2961, editing.longitude ?? 85.8245]}
                selectedPosition={
                  editing.latitude && editing.longitude
                    ? [editing.latitude, editing.longitude]
                    : undefined
                }
                zoom={14}
                onMapClick={handleMapClick}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              required
              step="any"
              value={editing.latitude ?? 0}
              onChange={(e) => setEditing((s) => ({ ...s, latitude: Number(e.target.value) }))}
            />
            <Input
              label="Longitude"
              type="number"
              required
              step="any"
              value={editing.longitude ?? 0}
              onChange={(e) => setEditing((s) => ({ ...s, longitude: Number(e.target.value) }))}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/30 p-2.5 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" className="w-full">{editing.id ? "Save changes" : "Add stop"}</Button>
        </form>
      </Modal>
    </div>
  );
}

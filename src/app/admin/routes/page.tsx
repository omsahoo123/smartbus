"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listRoutes, createRoute, updateRoute, deleteRoute } from "@/services/routes";
import type { RouteRow } from "@/types/database";

const EMPTY: Partial<RouteRow> = {
  route_name: "", source: "", destination: "", distance: undefined, estimated_duration: "", status: "active",
};

export default function AdminRoutesPage() {
  const supabase = createClient();
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<RouteRow>>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setRoutes((await listRoutes(supabase)) as RouteRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function openCreate() { setEditing(EMPTY); setError(null); setModalOpen(true); }
  function openEdit(r: RouteRow) { setEditing(r); setError(null); setModalOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        route_name: editing.route_name!,
        source: editing.source!,
        destination: editing.destination!,
        distance: editing.distance ?? undefined,
        estimated_duration: editing.estimated_duration ?? undefined,
        status: editing.status ?? "active",
      };
      if (editing.id) {
        await updateRoute(supabase, editing.id, payload);
      } else {
        await createRoute(supabase, payload);
      }
      setModalOpen(false);
      load();
    } catch (err: any) { setError(err.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this route? Related schedules and trips will also be removed.")) return;
    await deleteRoute(supabase, id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Routes</h1>
        <Button onClick={openCreate}>Add route</Button>
      </div>

      <DataTable
        loading={loading}
        rows={routes}
        emptyLabel="No routes yet. Add your first route."
        columns={[
          { header: "Route", cell: (r) => r.route_name },
          { header: "Source", cell: (r) => r.source },
          { header: "Destination", cell: (r) => r.destination },
          { header: "Distance", cell: (r) => r.distance ? `${r.distance} km` : "—" },
          { header: "Duration", cell: (r) => r.estimated_duration ?? "—" },
          { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
          {
            header: "",
            cell: (r) => (
              <div className="flex gap-3">
                <button onClick={() => openEdit(r)} className="text-primary hover:underline">Edit</button>
                <button onClick={() => handleDelete(r.id)} className="text-danger hover:underline">Delete</button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing.id ? "Edit route" : "Add route"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Route name"
            required
            value={editing.route_name ?? ""}
            onChange={(e) => setEditing((s) => ({ ...s, route_name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Source city"
              required
              value={editing.source ?? ""}
              onChange={(e) => setEditing((s) => ({ ...s, source: e.target.value }))}
            />
            <Input
              label="Destination city"
              required
              value={editing.destination ?? ""}
              onChange={(e) => setEditing((s) => ({ ...s, destination: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Distance (km)"
              type="number"
              step="any"
              value={editing.distance ?? ""}
              onChange={(e) => setEditing((s) => ({ ...s, distance: e.target.value ? Number(e.target.value) : undefined }))}
            />
            <Input
              label="Est. duration (HH:MM:SS)"
              placeholder="01:30:00"
              value={editing.estimated_duration ?? ""}
              onChange={(e) => setEditing((s) => ({ ...s, estimated_duration: e.target.value }))}
            />
          </div>
          <Select
            label="Status"
            value={editing.status ?? "active"}
            onChange={(e) => setEditing((s) => ({ ...s, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">{editing.id ? "Save changes" : "Add route"}</Button>
        </form>
      </Modal>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { listStops, createStop, updateStop, deleteStop } from "@/services/stops";
import type { Stop } from "@/types/database";

const EMPTY: Partial<Stop> = { name: "", address: "", latitude: 0, longitude: 0 };

export default function AdminStopsPage() {
  const supabase = createClient();
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Stop>>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setStops(await listStops(supabase));
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function openCreate() { setEditing(EMPTY); setError(null); setModalOpen(true); }
  function openEdit(s: Stop) { setEditing(s); setError(null); setModalOpen(true); }

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
    } catch (err: any) { setError(err.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this stop? Routes using it may be affected.")) return;
    await deleteStop(supabase, id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Stops</h1>
        <Button onClick={openCreate}>Add stop</Button>
      </div>

      <DataTable
        loading={loading}
        rows={stops}
        emptyLabel="No stops yet. Add your first bus stop to get started."
        columns={[
          { header: "Name", cell: (s) => s.name },
          { header: "Address", cell: (s) => s.address ?? "—" },
          { header: "Latitude", cell: (s) => s.latitude.toFixed(4) },
          { header: "Longitude", cell: (s) => s.longitude.toFixed(4) },
          {
            header: "",
            cell: (s) => (
              <div className="flex gap-3">
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
            value={editing.address ?? ""}
            onChange={(e) => setEditing((s) => ({ ...s, address: e.target.value }))}
          />
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
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">{editing.id ? "Save changes" : "Add stop"}</Button>
        </form>
      </Modal>
    </div>
  );
}

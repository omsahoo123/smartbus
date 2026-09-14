"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listBuses, createBus, updateBus, deleteBus } from "@/services/buses";
import type { Bus } from "@/types/database";

const EMPTY: Partial<Bus> = {
  bus_number: "",
  registration_number: "",
  bus_type: "ac_seater",
  capacity: 40,
  status: "active",
};

// This page is the reference CRUD pattern (list + modal form + edit/delete)
// used the same way across admin/routes, admin/stops, admin/schedules,
// admin/drivers, etc. -- copy this shape rather than reinventing it per page.
export default function AdminBusesPage() {
  const supabase = createClient();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Bus>>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setBuses(await listBuses(supabase));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(EMPTY);
    setModalOpen(true);
  }

  function openEdit(bus: Bus) {
    setEditing(bus);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing.id) {
        await updateBus(supabase, editing.id, editing);
      } else {
        await createBus(supabase, editing);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this bus? This cannot be undone.")) return;
    await deleteBus(supabase, id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Buses</h1>
        <Button onClick={openCreate}>Add bus</Button>
      </div>

      <DataTable
        loading={loading}
        rows={buses}
        emptyLabel="No buses yet. Add your first bus to get started."
        columns={[
          { header: "Bus #", cell: (b) => b.bus_number },
          { header: "Registration", cell: (b) => b.registration_number },
          { header: "Type", cell: (b) => b.bus_type.replace(/_/g, " ") },
          { header: "Capacity", cell: (b) => b.capacity },
          { header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
          {
            header: "",
            cell: (b) => (
              <div className="flex gap-3">
                <button onClick={() => openEdit(b)} className="text-primary hover:underline">Edit</button>
                <button onClick={() => handleDelete(b.id)} className="text-danger hover:underline">Delete</button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing.id ? "Edit bus" : "Add bus"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Bus number"
            required
            value={editing.bus_number ?? ""}
            onChange={(e) => setEditing((s) => ({ ...s, bus_number: e.target.value }))}
          />
          <Input
            label="Registration number"
            required
            value={editing.registration_number ?? ""}
            onChange={(e) => setEditing((s) => ({ ...s, registration_number: e.target.value }))}
          />
          <Select
            label="Bus type"
            value={editing.bus_type}
            onChange={(e) => setEditing((s) => ({ ...s, bus_type: e.target.value }))}
          >
            <option value="ac_seater">AC Seater</option>
            <option value="non_ac_seater">Non-AC Seater</option>
            <option value="ac_sleeper">AC Sleeper</option>
            <option value="non_ac_sleeper">Non-AC Sleeper</option>
          </Select>
          <Input
            label="Capacity"
            type="number"
            required
            min={1}
            value={editing.capacity ?? 0}
            onChange={(e) => setEditing((s) => ({ ...s, capacity: Number(e.target.value) }))}
          />
          <Select
            label="Status"
            value={editing.status}
            onChange={(e) => setEditing((s) => ({ ...s, status: e.target.value as Bus["status"] }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </Select>

          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">{editing.id ? "Save changes" : "Add bus"}</Button>
        </form>
      </Modal>
    </div>
  );
}

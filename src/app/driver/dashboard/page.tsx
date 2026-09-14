import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Bus,
  Navigation,
  Radio,
  Clock,
  MapPin,
  AlertTriangle,
  History,
  ShieldCheck,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default async function DriverDashboard() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: driverRow } = await supabase
    .from("drivers")
    .select("id, assigned_bus_id, bus:buses ( bus_number, bus_type, capacity )")
    .eq("profile_id", user?.id ?? "")
    .maybeSingle();
  const driver = driverRow as any;

  const today = new Date().toISOString().slice(0, 10);
  const { data: tripRow } = await supabase
    .from("trips")
    .select("id, status, trip_date, route:routes ( route_name, source, destination )")
    .eq("driver_id", driver?.id ?? "")
    .eq("trip_date", today)
    .maybeSingle();
  const trip = tripRow as any;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Driver Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-dark mb-2">
            <Bus className="h-3.5 w-3.5" />
            <span>Driver Operations Console</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Today&apos;s Duty & Trip
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Assigned Bus: <span className="font-mono font-bold text-ink">{driver?.bus?.bus_number ?? "Unassigned"}</span>{" "}
            {driver?.bus?.bus_type ? `(${driver.bus.bus_type} • ${driver?.bus?.capacity ?? 40} Seats)` : ""}
          </p>
        </div>

        {trip?.status === "running" && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>TRIP IN PROGRESS • GPS TRANSMITTING</span>
          </div>
        )}
      </div>

      {/* Primary Trip HUD */}
      {!trip ? (
        <Card className="border-dashed p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-bg text-muted mb-4 border border-line">
            <Bus className="h-7 w-7" />
          </div>
          <h2 className="font-display text-lg font-bold text-ink">No Trip Scheduled Today</h2>
          <p className="mt-1 text-xs sm:text-sm text-muted max-w-md mx-auto">
            You do not have any active routes assigned for today ({today}). Contact fleet operations dispatch if your schedule needs updating.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/driver/trips"
              className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-bg transition"
            >
              View all trips
            </Link>
          </div>
        </Card>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-lg shadow-black/[0.03]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-bold text-primary">
                  SCHEDULED TODAY
                </span>
                <StatusBadge status={trip.status} />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">
                {trip.route?.route_name || "Daily Route"}
              </h2>
              <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-muted">
                <span className="font-medium text-ink">{trip.route?.source}</span>
                <span>&rarr;</span>
                <span className="font-medium text-ink">{trip.route?.destination}</span>
              </div>
            </div>

            <Link
              href={`/driver/trips/${trip.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition active:scale-[0.99]"
            >
              <Navigation className="h-4 w-4" />
              <span>{trip.status === "running" ? "Open Active Trip HUD" : "Start Trip"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl bg-bg p-3.5">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Bus Number</span>
              <span className="font-mono font-bold text-ink text-sm mt-0.5 block">{driver?.bus?.bus_number ?? "N/A"}</span>
            </div>
            <div className="rounded-xl bg-bg p-3.5">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Vehicle Type</span>
              <span className="font-medium text-ink text-sm mt-0.5 block">{driver?.bus?.bus_type ?? "Standard"}</span>
            </div>
            <div className="rounded-xl bg-bg p-3.5">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Date</span>
              <span className="font-medium text-ink text-sm mt-0.5 block">{trip.trip_date}</span>
            </div>
            <div className="rounded-xl bg-bg p-3.5">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Telemetry Status</span>
              <span className="font-medium text-emerald-700 text-sm mt-0.5 block flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {trip.status === "running" ? "Transmitting" : "Ready"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Driver Utility Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/driver/tracking" className="block group">
          <Card className="h-full p-5 hover:border-primary/50 hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-white transition">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <p className="font-display text-base font-bold text-ink">Live GPS Telemetry</p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Verify your GPS coordinates and ensure the passenger map is tracking your current location accurately.
            </p>
          </Card>
        </Link>

        <Link href="/driver/history" className="block group">
          <Card className="h-full p-5 hover:border-primary/50 hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-ink mb-3 group-hover:bg-primary-light transition">
              <History className="h-5 w-5" />
            </div>
            <p className="font-display text-base font-bold text-ink">Trip History</p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Review completed runs, logs, on-time percentages, and past passenger counts.
            </p>
          </Card>
        </Link>

        <Link href="/driver/profile" className="block group">
          <Card className="h-full p-5 hover:border-primary/50 hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-ink mb-3 group-hover:bg-primary-light transition">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="font-display text-base font-bold text-ink">Driver Profile</p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Manage your commercial driving license details, vehicle assignments, and credentials.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

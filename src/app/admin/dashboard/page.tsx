import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatsCard, Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Bus,
  Users,
  Ticket,
  Navigation,
  CreditCard,
  Radio,
  Route,
  MapPin,
  Calendar,
  ChevronRight,
  Shield,
  Activity,
  PlusCircle
} from "lucide-react";

export default async function AdminDashboard() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: busCount },
    { count: passengerCount },
    { count: todaysBookings },
    { count: activeTrips }
  ] = await Promise.all([
    supabase.from("buses").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "people"),
    supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "running"),
  ]);

  const { data: revenueRows } = await supabase.from("payments").select("amount").eq("status", "paid");
  const revenue = (revenueRows ?? []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);

  const { data: liveBuses } = await supabase
    .from("trips")
    .select("id, status, bus:buses ( bus_number, bus_type ), route:routes ( route_name, source, destination )")
    .eq("status", "running");

  return (
    <div className="space-y-8 animate-in fade-in duration-300" id="live">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Shield className="h-3.5 w-3.5" />
            <span>Operations Command Center</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Fleet & Transit Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Monitor real-time urban bus operations, passenger booking volume, and revenue metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/buses"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Manage Buses</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Total Fleet Buses"
          value={busCount ?? 0}
          icon={<Bus className="h-5 w-5" />}
          hint="Registered in fleet inventory"
        />
        <StatsCard
          label="Registered Passengers"
          value={passengerCount ?? 0}
          icon={<Users className="h-5 w-5" />}
          hint="Active commuter accounts"
        />
        <StatsCard
          label="Today's Bookings"
          value={todaysBookings ?? 0}
          icon={<Ticket className="h-5 w-5" />}
          trend="Live updates"
        />
        <StatsCard
          label="Active Trips Running"
          value={activeTrips ?? 0}
          icon={<Navigation className="h-5 w-5" />}
          hint="Broadcasting telemetry"
        />
        <StatsCard
          label="Total Revenue"
          value={`₹${revenue.toLocaleString("en-IN")}`}
          icon={<CreditCard className="h-5 w-5" />}
          hint="All verified digital payments"
        />
        <StatsCard
          label="Live Fleet Buses"
          value={liveBuses?.length ?? 0}
          icon={<Radio className="h-5 w-5 text-emerald-600 animate-pulse" />}
          hint="Real-time map visible"
        />
      </div>

      {/* Live Fleet Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
            <h2 className="font-display text-lg font-bold text-ink">Live Buses on Road</h2>
          </div>
          <Link
            href="/admin/trips"
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            <span>View all trips</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {(liveBuses ?? []).length === 0 ? (
          <Card className="border-dashed p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-muted mb-3 border border-line">
              <Bus className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-semibold text-ink">No buses are currently running</p>
            <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
              When drivers start their scheduled trips, their live telemetry and route progress will display here in real time.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(liveBuses ?? []).map((t: any) => (
              <Card key={t.id} className="p-5 hover:border-primary/50 hover:shadow-md transition group">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-base text-ink group-hover:text-primary transition-colors">
                      {t.bus?.bus_number}
                    </span>
                    <p className="text-xs text-muted">{t.bus?.bus_type || "City Fleet"}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <div className="mt-4 pt-3 border-t border-line/60">
                  <p className="text-xs font-semibold text-ink">{t.route?.route_name || "Daily Route"}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t.route?.source} &rarr; {t.route?.destination}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <Link
                    href={`/admin/trips`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Inspect trip</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Admin Quick Operations Shortcuts */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Link href="/admin/routes" className="block group">
          <Card className="p-4 hover:border-primary/50 transition">
            <Route className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-bold text-ink">Routes</p>
            <p className="text-xs text-muted">Create & edit transit routes</p>
          </Card>
        </Link>
        <Link href="/admin/stops" className="block group">
          <Card className="p-4 hover:border-primary/50 transition">
            <MapPin className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-bold text-ink">Bus Stops</p>
            <p className="text-xs text-muted">Manage GPS stops & orders</p>
          </Card>
        </Link>
        <Link href="/admin/schedules" className="block group">
          <Card className="p-4 hover:border-primary/50 transition">
            <Calendar className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-bold text-ink">Schedules</p>
            <p className="text-xs text-muted">Set timetables & frequencies</p>
          </Card>
        </Link>
        <Link href="/admin/reports" className="block group">
          <Card className="p-4 hover:border-primary/50 transition">
            <Activity className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-bold text-ink">Reports</p>
            <p className="text-xs text-muted">Revenue & occupancy analytics</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { listMyBookings } from "@/services/bookings";
import {
  Search,
  MapPin,
  Calendar,
  Radio,
  CreditCard,
  Ticket,
  ChevronRight,
  Bus,
  Clock,
  Navigation,
  Compass,
  QrCode,
  CheckCircle2
} from "lucide-react";

export default async function PassengerDashboard() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const bookings = user ? await listMyBookings(supabase, user.id) : [];
  const upcoming = bookings.filter((b: any) => b.booking_status === "confirmed").slice(0, 3);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 mb-2">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Real-time City Transit Active</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Where would you like to travel today?
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Plan your journey, track approaching buses live, or access your digital tickets.
          </p>
        </div>

        <Link
          href="/passenger/tracking"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition"
        >
          <Radio className="h-4 w-4 animate-pulse" />
          <span>Open Live Fleet Map</span>
        </Link>
      </div>

      {/* 2. FAST ROUTE SEARCH CARD */}
      <Card className="p-5 sm:p-6 shadow-md shadow-black/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-ink flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span>Search & Book Buses</span>
          </h2>
          <span className="text-xs text-muted">Guaranteed atomic seat reservations</span>
        </div>

        <form action="/passenger/search" method="GET" className="grid gap-3 sm:grid-cols-12">
          <div className="sm:col-span-4 relative">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
              From
            </label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
              <input
                name="source"
                placeholder="Pickup station"
                className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="sm:col-span-4 relative">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
              To
            </label>
            <div className="relative flex items-center">
              <Navigation className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
              <input
                name="destination"
                placeholder="Destination stop"
                className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="sm:col-span-2 relative">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
              Date
            </label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
              <input
                name="date"
                type="date"
                defaultValue={today}
                className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-2 text-sm text-ink focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition active:scale-[0.99]"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>
        </form>
      </Card>

      {/* 3. UPCOMING TICKETS & LIVE JOURNEYS */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-ink">Upcoming Tickets</h2>
          </div>
          <Link
            href="/passenger/tickets"
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            <span>View all tickets</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <Card className="border-dashed p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Ticket className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-semibold text-ink">No upcoming trips booked</p>
            <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
              You do not have any active journeys scheduled. Use the search bar above to book your next trip.
            </p>
            <Link
              href="/passenger/search"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition"
            >
              <span>Explore buses</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((b: any) => (
              <Card
                key={b.id}
                className="flex flex-col justify-between border-line p-5 hover:border-primary/50 hover:shadow-md transition group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-muted mb-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Confirmed</span>
                    </span>
                    <span className="font-mono text-ink/70">Seat {b.seat_number || "Assigned"}</span>
                  </div>

                  <p className="font-display text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {b.trip?.route?.route_name || "City Transit Line"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {b.trip?.route?.source} &rarr; {b.trip?.route?.destination}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted border-t border-line/60 pt-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{b.trip?.trip_date}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono font-medium text-ink">
                      <Bus className="h-3.5 w-3.5" />
                      <span>{b.trip?.bus?.bus_number}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-line">
                  <Link
                    href={`/passenger/tickets/${b.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-bg py-2 text-xs font-semibold text-ink group-hover:bg-primary group-hover:text-white transition"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    <span>View QR Ticket</span>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 4. QUICK ACTION CARDS */}
      <div>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Transit Services</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/passenger/tracking" className="block group">
            <Card className="h-full p-5 hover:border-primary/50 hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <p className="font-display text-base font-bold text-ink">Live Bus Tracking</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Track exact bus locations, speed, and real-time arrival estimates on an interactive map.
              </p>
            </Card>
          </Link>

          <Link href="/passenger/stops" className="block group">
            <Card className="h-full p-5 hover:border-primary/50 hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-white transition">
                <Compass className="h-5 w-5" />
              </div>
              <p className="font-display text-base font-bold text-ink">Nearby Bus Stops</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Find stops within walking distance using your GPS coordinates and view incoming bus schedules.
              </p>
            </Card>
          </Link>

          <Link href="/passenger/passes" className="block group">
            <Card className="h-full p-5 hover:border-primary/50 hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-dark mb-3 group-hover:bg-accent group-hover:text-white transition">
                <CreditCard className="h-5 w-5" />
              </div>
              <p className="font-display text-base font-bold text-ink">Smart Transit Passes</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Get unlimited daily, weekly, or monthly travel passes with one-click digital activation.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { listMyBookings } from "@/services/bookings";
import { listStops } from "@/services/stops";
import { HeroSearchWidget } from "@/components/booking/HeroSearchWidget";
import {
  Radio,
  CreditCard,
  Ticket,
  ChevronRight,
  Bus,
  Calendar,
  Compass,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  MapPin
} from "lucide-react";

export default async function PassengerDashboard() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const bookings = user ? await listMyBookings(supabase, user.id) : [];
  const upcoming = bookings.filter((b: any) => b.booking_status === "confirmed").slice(0, 3);
  const stops = await listStops(supabase).catch(() => []);
  const stopNames = (stops || []).map((s: any) => s.name);

  const today = new Date().toISOString().slice(0, 10);

  // Fetch featured active or upcoming trips
  const { data: tripsData } = await supabase
    .from("trips")
    .select(
      `id, trip_date, status,
       bus:buses ( id, bus_number, bus_type, capacity ),
       route:routes ( id, route_name, source, destination ),
       schedule:schedules ( departure_time, arrival_time )`
    )
    .order("trip_date", { ascending: true })
    .limit(6);

  const featuredTrips = tripsData || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO SECTION (Dark Teal Gradient + Glassmorphism Search Panel) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#08362E] via-[#0F5C4F] to-[#146B5C] p-6 sm:p-8 lg:p-10 shadow-2xl text-white">
        {/* Background decorative ambient lights */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="relative z-10">
          {/* Header pill & title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-emerald-200 border border-white/20 mb-3 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>Ama Bus Odisha • Real-Time Transit Active</span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Book Your Journey
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
                Seamless travel across Bhubaneswar, Cuttack, and Puri with instant QR ticketing & live GPS tracking.
              </p>
            </div>

            <Link
              href="/passenger/tracking"
              className="inline-flex items-center self-start sm:self-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2.5 text-xs sm:text-sm font-semibold text-white border border-white/30 transition shadow-sm active:scale-95"
            >
              <Radio className="h-4 w-4 animate-pulse text-emerald-300" />
              <span>Live Fleet Map</span>
            </Link>
          </div>

          {/* Frosted Glass Search Widget */}
          <HeroSearchWidget stopNames={stopNames} defaultDate={today} />
        </div>
      </div>

      {/* 2. UPCOMING TRIP BANNER (if user has active bookings) */}
      {upcoming.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-ink">Active Journey & Tickets</h2>
            </div>
            <Link
              href="/passenger/tickets"
              className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline"
            >
              <span>View all tickets</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((b: any) => (
              <Card
                key={b.id}
                className="flex flex-col justify-between border-line p-5 hover:border-primary/50 hover:shadow-lg transition-all group bg-surface"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-muted mb-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Confirmed Pass</span>
                    </span>
                    <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      Seat {b.seat_number || "Assigned"}
                    </span>
                  </div>

                  <p className="font-display text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {b.trip?.route?.route_name || "Mo Bus Transit Line"}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted font-medium">
                    <span>{b.trip?.route?.source}</span>
                    <ArrowRight className="h-3 w-3 text-primary" />
                    <span>{b.trip?.route?.destination}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted border-t border-line/60 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted" />
                      <span>{b.trip?.trip_date}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono font-medium text-ink">
                      <Bus className="h-3.5 w-3.5 text-primary" />
                      <span>{b.trip?.bus?.bus_number}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-line">
                  <Link
                    href={`/passenger/tickets/${b.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg py-2.5 text-xs font-bold text-ink group-hover:bg-primary group-hover:text-white transition shadow-sm"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>View QR Boarding Ticket</span>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. BUS RESULTS / FEATURED LIVE DEPARTURES (Matches Mockup) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              <span>Available Bus Departures</span>
            </h2>
            <p className="text-xs text-muted mt-0.5">Frequent express and AC services running across Odisha</p>
          </div>
          <Link
            href="/passenger/search"
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            <span>Explore all</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {featuredTrips.length === 0 ? (
          <Card className="border-dashed p-8 text-center bg-surface">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Bus className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-semibold text-ink">Ready to schedule your journey</p>
            <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
              Use the search bar above to look up scheduled Mo Bus departures between any two stations.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTrips.map((t: any) => {
              const busNum = t.bus?.bus_number || `Bus #${t.id.slice(0, 4)}`;
              const departure = t.schedule?.departure_time || "08:00 AM";
              const arrival = t.schedule?.arrival_time || "10:30 AM";
              const busType = t.bus?.bus_type?.replace(/_/g, " ") || "AC Seater";
              const routeName = t.route?.route_name || "Express Transit";
              const source = t.route?.source || "Bhubaneswar";
              const destination = t.route?.destination || "Puri";

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-line bg-surface p-5 hover:border-primary/50 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Bus Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-display text-base font-extrabold text-ink group-hover:text-primary transition-colors">
                          {busNum}
                        </span>
                        <p className="text-[11px] text-muted font-medium">{routeName}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {busType}
                      </span>
                    </div>

                    {/* Dotted Route Timeline */}
                    <div className="my-4 rounded-xl bg-bg/80 p-3.5 border border-line/60">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted">Departure</p>
                          <p className="font-bold text-ink mt-0.5">{departure}</p>
                          <p className="text-[11px] text-muted truncate max-w-[90px]">{source}</p>
                        </div>

                        {/* Animated route dots connector */}
                        <div className="flex-1 px-3 flex flex-col items-center">
                          <div className="w-full flex items-center justify-between">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#E9A23B] ring-2 ring-white"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#E9A23B]/60"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0F5C4F]/60"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0F5C4F]/60"></span>
                            <span className="h-2.5 w-2.5 rounded-full bg-[#0F5C4F] ring-2 ring-white"></span>
                          </div>
                          <div className="w-full h-0.5 border-t border-dashed border-muted/40 -mt-1.5"></div>
                          <span className="text-[9px] text-muted font-semibold mt-2">Daily Service</span>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-muted">Arrival</p>
                          <p className="font-bold text-ink mt-0.5">{arrival}</p>
                          <p className="text-[11px] text-muted truncate max-w-[90px]">{destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fare & Book CTA */}
                  <div className="mt-2 pt-3 border-t border-line/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted uppercase font-bold block">Fare</span>
                      <span className="font-display text-xl font-bold text-ink">₹499</span>
                    </div>

                    <Link
                      href={`/passenger/buses/${t.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E9A23B] to-[#F59E0B] px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-95 transition"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. QUICK ACTION CARDS (Matches Mockup Bottom Row) */}
      <div>
        <h2 className="mb-4 font-display text-lg sm:text-xl font-bold text-ink">Transit Services</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Live Tracking */}
          <Link href="/passenger/tracking" className="block group">
            <div className="h-full rounded-2xl border border-line bg-surface p-5 hover:border-primary/50 hover:shadow-lg transition-all flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                    Live Tracking
                  </p>
                  <p className="text-[11px] text-muted">GPS fleet positions & ETA</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted group-hover:translate-x-1 group-hover:text-primary transition" />
            </div>
          </Link>

          {/* My Tickets */}
          <Link href="/passenger/tickets" className="block group">
            <div className="h-full rounded-2xl border border-line bg-surface p-5 hover:border-primary/50 hover:shadow-lg transition-all flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Ticket className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                    My Tickets
                  </p>
                  <p className="text-[11px] text-muted">QR code boarding passes</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted group-hover:translate-x-1 group-hover:text-primary transition" />
            </div>
          </Link>

          {/* Transit Passes */}
          <Link href="/passenger/passes" className="block group">
            <div className="h-full rounded-2xl border border-line bg-surface p-5 hover:border-primary/50 hover:shadow-lg transition-all flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                    Transit Pass
                  </p>
                  <p className="text-[11px] text-muted">Daily & monthly unlimited</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted group-hover:translate-x-1 group-hover:text-primary transition" />
            </div>
          </Link>

          {/* Nearby Stops */}
          <Link href="/passenger/stops" className="block group">
            <div className="h-full rounded-2xl border border-line bg-surface p-5 hover:border-primary/50 hover:shadow-lg transition-all flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                  <Compass className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                    Nearby Stops
                  </p>
                  <p className="text-[11px] text-muted">Find stations around you</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted group-hover:translate-x-1 group-hover:text-primary transition" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

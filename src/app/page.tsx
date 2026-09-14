"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bus,
  Menu,
  X,
  Search,
  MapPin,
  Calendar,
  Navigation,
  ShieldCheck,
  CreditCard,
  Radio,
  QrCode,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
  PhoneCall,
  Activity
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const popularRoutes = [
    {
      id: "R11",
      from: "Master Canteen",
      to: "Infocity IT Hub",
      duration: "35 mins",
      frequency: "Every 10 mins",
      fare: "₹25",
      type: "AC Electric",
    },
    {
      id: "R24",
      from: "Baramunda Terminal",
      to: "Biju Patnaik Airport",
      duration: "25 mins",
      frequency: "Every 15 mins",
      fare: "₹20",
      type: "City Express",
    },
    {
      id: "R33",
      from: "Railway Station",
      to: "Puri Sea Beach",
      duration: "75 mins",
      frequency: "Every 30 mins",
      fare: "₹70",
      type: "Intercity Deluxe",
    },
    {
      id: "R18",
      from: "KIIT Campus",
      to: "AIIMS Hospital",
      duration: "40 mins",
      frequency: "Every 12 mins",
      fare: "₹30",
      type: "AC Electric",
    },
  ];

  return (
    <main className="min-h-screen bg-bg text-ink selection:bg-primary selection:text-white">
      {/* 1. TOP ANNOUNCEMENT PILL */}
      <div className="bg-primary-dark text-white px-4 py-2 text-xs text-center font-medium flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span>SmartBus Real-Time Network is Active: 42 fleet buses currently running across 18 routes</span>
        <Link href="/passenger/tracking" className="underline font-semibold ml-2 hover:text-accent">
          View live map &rarr;
        </Link>
      </div>

      {/* 2. RESPONSIVE HEADER */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-ink">SmartBus</span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Smart Mobility
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-ink/80">
            <a href="#features" className="hover:text-primary transition">Features</a>
            <a href="#roles" className="hover:text-primary transition">For Everyone</a>
            <a href="#steps" className="hover:text-primary transition">How It Works</a>
            <a href="#routes" className="hover:text-primary transition">Popular Routes</a>
            <Link href="/passenger/tracking" className="flex items-center gap-1.5 text-emerald-700 font-semibold hover:text-emerald-800 transition">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>Live Tracking</span>
            </Link>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:border-primary hover:text-primary transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition"
            >
              Get started
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink hover:bg-bg lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-line bg-surface px-4 pb-6 pt-3 lg:hidden shadow-xl animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-3 text-sm font-medium text-ink/80">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 hover:bg-bg hover:text-primary"
              >
                Features
              </a>
              <a
                href="#roles"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 hover:bg-bg hover:text-primary"
              >
                All Roles (Passenger, Driver, Admin)
              </a>
              <a
                href="#steps"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 hover:bg-bg hover:text-primary"
              >
                How It Works
              </a>
              <a
                href="#routes"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 hover:bg-bg hover:text-primary"
              >
                Popular Routes
              </a>
              <Link
                href="/passenger/tracking"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-emerald-700 font-semibold hover:bg-emerald-50"
              >
                <Radio className="h-4 w-4 animate-pulse" />
                <span>Live GPS Tracking</span>
              </Link>
            </nav>

            <div className="mt-4 flex flex-col gap-2.5 pt-3 border-t border-line">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg border border-line py-2.5 text-center text-sm font-medium text-ink hover:bg-bg"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-primary-dark"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION WITH SEARCH & LIVE TRANSIT HUD */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-line bg-gradient-to-b from-surface to-bg">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0F5C4F_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Gen Smart Urban Transit</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-[1.15] lg:text-6xl">
                Catch your bus with <span className="text-primary underline decoration-accent/60 underline-offset-4">confidence</span>, not guesswork.
              </h1>

              {/* Subhead */}
              <p className="mt-5 text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
                Search routes, reserve verified seats with atomic double-booking guards, and watch your bus approach in real time on an interactive GPS map &mdash; all with zero paper tickets.
              </p>

              {/* Search Widget */}
              <div className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-lg shadow-black/[0.04]">
                <form action="/passenger/search" method="GET" className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4 relative">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                      Departure
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                      <input
                        type="text"
                        name="source"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="e.g. Master Canteen"
                        className="w-full rounded-lg border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4 relative">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                      Destination
                    </label>
                    <div className="relative flex items-center">
                      <Navigation className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                      <input
                        type="text"
                        name="destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Infocity / Airport"
                        className="w-full rounded-lg border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4 relative">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                      Date
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
                      <input
                        type="date"
                        name="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-line bg-bg py-2.5 pl-9 pr-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-12 mt-2">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition active:scale-[0.99]"
                    >
                      <Search className="h-4 w-4" />
                      <span>Search Available Buses</span>
                    </button>
                  </div>
                </form>

                {/* Quick Chips */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-medium">Quick routes:</span>
                  <button
                    type="button"
                    onClick={() => { setSource("Master Canteen"); setDestination("Infocity"); }}
                    className="rounded-full bg-bg px-2.5 py-1 text-ink hover:bg-primary-light hover:text-primary transition"
                  >
                    Master Canteen &rarr; Infocity
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSource("Baramunda"); setDestination("Airport"); }}
                    className="rounded-full bg-bg px-2.5 py-1 text-ink hover:bg-primary-light hover:text-primary transition"
                  >
                    Baramunda &rarr; Airport
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSource("Railway Station"); setDestination("Puri"); }}
                    className="rounded-full bg-bg px-2.5 py-1 text-ink hover:bg-primary-light hover:text-primary transition"
                  >
                    Station &rarr; Puri
                  </button>
                </div>
              </div>

              {/* Trust stats row */}
              <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-10 text-xs sm:text-sm text-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Guaranteed Seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
                  <span>Sub-second GPS Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span>Contactless Boarding</span>
                </div>
              </div>
            </div>

            {/* Right Live Simulation Transit Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-line bg-surface p-6 shadow-xl shadow-black/[0.06]">
                {/* Status pill header */}
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink">BUS SB-101 • ROUTE 11</p>
                      <p className="text-[11px] text-muted">Master Canteen &rarr; Infocity</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    ON TIME
                  </span>
                </div>

                {/* Telemetry Bar */}
                <div className="my-4 grid grid-cols-3 gap-2 rounded-xl bg-bg p-3 text-center text-xs">
                  <div>
                    <span className="block text-[10px] uppercase text-muted">Speed</span>
                    <span className="font-semibold text-ink">42 km/h</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-muted">Next Stop</span>
                    <span className="font-semibold text-primary">In 3 mins</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-muted">Occupancy</span>
                    <span className="font-semibold text-ink">28 / 40</span>
                  </div>
                </div>

                {/* Interactive Stop Timeline */}
                <div className="space-y-4 py-2">
                  <div className="relative pl-6">
                    <span className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/10" />
                    <p className="text-xs font-bold text-ink">Master Canteen Terminal</p>
                    <p className="text-[11px] text-muted">Departed 08:00 AM • On schedule</p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
                    <p className="text-xs font-bold text-emerald-700">Vani Vihar Square (Approaching)</p>
                    <p className="text-[11px] text-muted">ETA 08:14 AM • Distance: 450 meters</p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-line bg-surface" />
                    <p className="text-xs font-medium text-ink/70">Jayadev Vihar Overbridge</p>
                    <p className="text-[11px] text-muted">Estimated 08:22 AM</p>
                  </div>

                  <div className="relative pl-6">
                    <span className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-line bg-surface" />
                    <p className="text-xs font-medium text-ink/70">Infocity IT Gate 1 (Destination)</p>
                    <p className="text-[11px] text-muted">Estimated 08:35 AM</p>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="mt-5 pt-4 border-t border-line">
                  <Link
                    href="/passenger/tracking"
                    className="flex w-full items-center justify-between rounded-xl bg-bg px-4 py-2.5 text-xs font-semibold text-ink hover:bg-primary-light hover:text-primary transition"
                  >
                    <span>Open full live map</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ALL ROLES SECTION */}
      <section id="roles" className="py-16 sm:py-24 bg-surface border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              All Platform Roles
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Engineered for Everyone on the Move
            </h2>
            <p className="mt-3 text-base text-muted">
              Whether you are catching your morning commute, operating a bus on schedule, or coordinating the city fleet &mdash; SmartBus gives you specialized, high-craft portals.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Role 1: Passenger */}
            <div className="flex flex-col rounded-2xl border border-line bg-bg p-6 sm:p-8 hover:border-primary/40 hover:shadow-lg transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                <Compass className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Role 01</span>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">Passenger Portal</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Book guaranteed seats in under a minute, track your approaching bus live on GPS, discover nearby stops, and commute paperlessly with instant QR passes.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs sm:text-sm text-ink/80 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Real-time GPS bus tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Interactive seat selection with double-booking lock</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Offline-ready QR boarding tickets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Daily, weekly & monthly smart passes</span>
                </li>
              </ul>
              <div className="mt-8 pt-4 border-t border-line">
                <Link
                  href="/login?role=people"
                  className="flex items-center justify-between font-semibold text-sm text-primary hover:text-primary-dark group"
                >
                  <span>Enter as Passenger</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Role 2: Driver */}
            <div className="flex flex-col rounded-2xl border border-line bg-bg p-6 sm:p-8 hover:border-accent/60 hover:shadow-lg transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent-dark mb-5">
                <Bus className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Role 02</span>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">Driver Portal</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                A dedicated, high-contrast driver HUD for road captains. Broadcast telemetry with one tap, view stop passenger manifests, and trigger emergency SOS.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs sm:text-sm text-ink/80 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-dark shrink-0" />
                  <span>1-Tap Start/End trip dispatch</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-dark shrink-0" />
                  <span>Automatic background GPS location broadcast</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-dark shrink-0" />
                  <span>Stop passenger boarding list</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-dark shrink-0" />
                  <span>Instant breakdown & emergency alert reporting</span>
                </li>
              </ul>
              <div className="mt-8 pt-4 border-t border-line">
                <Link
                  href="/login?role=driver"
                  className="flex items-center justify-between font-semibold text-sm text-accent-dark hover:text-accent group"
                >
                  <span>Enter as Driver</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Role 3: Fleet Administrator */}
            <div className="flex flex-col rounded-2xl border border-line bg-bg p-6 sm:p-8 hover:border-primary/40 hover:shadow-lg transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Role 03</span>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">Fleet Admin Command</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                High-level operational oversight for transit controllers. Manage buses, routes, schedules, driver rosters, real-time revenue, and passenger feedback.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs sm:text-sm text-ink/80 flex-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Live fleet telemetry & status command map</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Full CRUD for buses, routes, stops & schedules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Driver assignments & user role provisioning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Financial reports & passenger sentiment metrics</span>
                </li>
              </ul>
              <div className="mt-8 pt-4 border-t border-line">
                <Link
                  href="/login?role=admin"
                  className="flex items-center justify-between font-semibold text-sm text-primary hover:text-primary-dark group"
                >
                  <span>Enter Admin Console</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ALL FEATURES SECTION */}
      <section id="features" className="py-16 sm:py-24 bg-bg border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Core Capabilities
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Engineered for Reliability & Scale
            </h2>
            <p className="mt-3 text-base text-muted">
              Every detail is designed to remove transit friction &mdash; from instant double-booking prevention to sub-second GPS telemetry.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">Real-Time Live GPS Sync</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Buses broadcast their coordinates via HTML5 Geolocation API, updated instantly on live maps via Supabase Realtime channels.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">Atomic Double-Booking Guard</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Powered by transactional PostgreSQL RPCs that lock requested seats instantly, making accidental double-booking mathematically impossible.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">Digital QR Boarding Passes</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Every ticket generates a high-contrast QR code with cryptographic verification that conductors can scan even with spotty connectivity.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">Nearby Bus Stops Finder</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Uses the Haversine formula and device geolocation to pinpoint bus stops within walking distance, complete with live departure schedules.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">Smart Transit Passes</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Self-serve purchase of daily, weekly, or monthly passes. Enjoy unlimited hops across the city network with automatic validity tracking.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm hover:shadow-md transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger mb-4">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">Instant Incident Telemetry</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Drivers can dispatch breakdown or emergency alerts in two taps, triggering instant notifications to passengers and fleet administrators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. STEPS SECTION: HOW IT WORKS */}
      <section id="steps" className="py-16 sm:py-24 bg-surface border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Simple 4-Step Journey
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              How SmartBus Works
            </h2>
            <p className="mt-3 text-base text-muted">
              From finding your route to boarding your bus, here is how frictionless urban transit becomes.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative rounded-2xl border border-line bg-bg p-6">
              <span className="font-display text-4xl font-extrabold text-primary/20">01</span>
              <h3 className="mt-3 font-display text-base font-bold text-ink">Search & Discover</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Enter where you are and where you need to be. Compare bus schedules, timings, seat availability, and fare options.
              </p>
            </div>

            <div className="relative rounded-2xl border border-line bg-bg p-6">
              <span className="font-display text-4xl font-extrabold text-primary/20">02</span>
              <h3 className="mt-3 font-display text-base font-bold text-ink">Choose Your Seat</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Pick window or aisle on our interactive seat map. Our atomic RPC locks your seat instantly to prevent double-booking.
              </p>
            </div>

            <div className="relative rounded-2xl border border-line bg-bg p-6">
              <span className="font-display text-4xl font-extrabold text-primary/20">03</span>
              <h3 className="mt-3 font-display text-base font-bold text-ink">Instant QR Ticket</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Confirm your booking and receive a digital QR ticket immediately on your phone &mdash; ready to scan offline.
              </p>
            </div>

            <div className="relative rounded-2xl border border-line bg-bg p-6">
              <span className="font-display text-4xl font-extrabold text-primary/20">04</span>
              <h3 className="mt-3 font-display text-base font-bold text-ink">Live Track & Board</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
                Track your bus approaching your stop in real time with live GPS. Hop on, show your QR code, and enjoy the ride.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. POPULAR TRANSIT ROUTES */}
      <section id="routes" className="py-16 sm:py-24 bg-bg border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Transit Network
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink">
                Popular City Routes
              </h2>
            </div>
            <Link
              href="/passenger/search"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark"
            >
              <span>Explore all routes</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularRoutes.map((route) => (
              <div
                key={route.id}
                className="rounded-xl border border-line bg-surface p-5 hover:border-primary/40 hover:shadow-md transition group"
              >
                <div className="flex items-center justify-between text-xs text-muted mb-3">
                  <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {route.id}
                  </span>
                  <span>{route.type}</span>
                </div>
                <p className="text-sm font-bold text-ink">{route.from}</p>
                <div className="my-1.5 text-xs text-muted">&darr; to</div>
                <p className="text-sm font-bold text-ink">{route.to}</p>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted block">Duration</span>
                    <span className="font-medium text-ink">{route.duration}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Frequency</span>
                    <span className="font-medium text-ink">{route.frequency}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Fare</span>
                    <span className="font-bold text-primary">{route.fare}</span>
                  </div>
                </div>

                <Link
                  href={`/passenger/search?source=${encodeURIComponent(route.from)}&destination=${encodeURIComponent(route.to)}`}
                  className="mt-4 block w-full text-center rounded-lg bg-bg py-2 text-xs font-semibold text-ink group-hover:bg-primary group-hover:text-white transition"
                >
                  Book this route
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PROOF & STATS BAR */}
      <section className="py-12 bg-primary text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white">50,000+</p>
              <p className="mt-1 text-xs sm:text-sm text-primary-light">Monthly Commuters</p>
            </div>
            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white">99.4%</p>
              <p className="mt-1 text-xs sm:text-sm text-primary-light">On-Time Accuracy</p>
            </div>
            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white">&lt; 30s</p>
              <p className="mt-1 text-xs sm:text-sm text-primary-light">Average Booking Time</p>
            </div>
            <div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white">100%</p>
              <p className="mt-1 text-xs sm:text-sm text-primary-light">Paperless Digital Passes</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. COMPREHENSIVE RESPONSIVE FOOTER */}
      <footer className="border-t border-line bg-surface text-ink pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 pb-10 border-b border-line">
            {/* Col 1: Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold">
                  <Bus className="h-5 w-5" />
                </div>
                <span className="font-display text-xl font-bold tracking-tight text-ink">SmartBus</span>
              </Link>
              <p className="mt-4 text-sm text-muted max-w-sm leading-relaxed">
                SmartBus is the next-generation smart urban mobility platform delivering real-time bus tracking, guaranteed atomic bookings, and contactless QR ticketing.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700">All systems operating normally</span>
              </div>
            </div>

            {/* Col 2: Passenger Links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Passengers</p>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                <li><Link href="/passenger/search" className="hover:text-primary transition">Search Routes</Link></li>
                <li><Link href="/passenger/tracking" className="hover:text-primary transition">Live Bus Tracking</Link></li>
                <li><Link href="/passenger/stops" className="hover:text-primary transition">Nearby Stops</Link></li>
                <li><Link href="/passenger/passes" className="hover:text-primary transition">Transit Passes</Link></li>
                <li><Link href="/passenger/tickets" className="hover:text-primary transition">My Tickets</Link></li>
              </ul>
            </div>

            {/* Col 3: Drivers & Fleet */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Drivers & Operations</p>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                <li><Link href="/login?role=driver" className="hover:text-primary transition">Driver Login</Link></li>
                <li><Link href="/driver/dashboard" className="hover:text-primary transition">Active Trip HUD</Link></li>
                <li><Link href="/driver/tracking" className="hover:text-primary transition">GPS Telemetry</Link></li>
                <li><Link href="/driver/history" className="hover:text-primary transition">Trip History</Link></li>
              </ul>
            </div>

            {/* Col 4: Fleet Management & Admin */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Fleet Command</p>
              <ul className="mt-3 space-y-2 text-sm text-ink/80">
                <li><Link href="/login?role=admin" className="hover:text-primary transition">Admin Console</Link></li>
                <li><Link href="/admin/dashboard" className="hover:text-primary transition">Operations Command</Link></li>
                <li><Link href="/admin/buses" className="hover:text-primary transition">Bus Fleet</Link></li>
                <li><Link href="/admin/routes" className="hover:text-primary transition">Route Management</Link></li>
                <li><Link href="/admin/reports" className="hover:text-primary transition">Revenue & Analytics</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
            <p>&copy; {new Date().getFullYear()} SmartBus Urban Mobility System. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-primary transition">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition">Terms of Service</a>
              <a href="#" className="hover:text-primary transition">Security</a>
              <a href="#" className="hover:text-primary transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

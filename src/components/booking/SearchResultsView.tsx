"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BusCard, BusCardProps } from "@/components/booking/BusCard";
import { StopAutocomplete } from "@/components/ui/StopAutocomplete";
import { Card } from "@/components/ui/Card";
import {
  Edit3,
  Calendar,
  Filter,
  ArrowRight,
  Bus,
  Search,
  Sparkles,
  RotateCcw,
  SlidersHorizontal
} from "lucide-react";

export interface SearchResultsTripItem {
  id: string;
  tripId: string;
  busNumber: string;
  busType: string;
  routeName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  seatsLeft: number;
  status: string;
  stops?: { name: string; sequence: number }[];
}

export function SearchResultsView({
  source,
  destination,
  date,
  stopNames,
  trips,
}: {
  source: string;
  destination: string;
  date: string;
  stopNames: string[];
  trips: SearchResultsTripItem[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editSource, setEditSource] = useState(source);
  const [editDestination, setEditDestination] = useState(destination);
  const [editDate, setEditDate] = useState(date);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filterOptions = ["All", "AC Seater", "Non-AC", "Sleeper", "Express"];

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (editSource) params.set("source", editSource);
    if (editDestination) params.set("destination", editDestination);
    if (editDate) params.set("date", editDate);
    setIsEditing(false);
    router.push(`/passenger/search?${params.toString()}`);
  };

  // Filter trips based on active chip
  const filteredTrips = trips.filter((t) => {
    if (activeFilter === "All") return true;
    const type = (t.busType || "").toLowerCase();
    if (activeFilter === "AC Seater") return type.includes("ac") && !type.includes("non");
    if (activeFilter === "Non-AC") return type.includes("non") || !type.includes("ac");
    if (activeFilter === "Sleeper") return type.includes("sleeper");
    if (activeFilter === "Express") return (t.routeName || "").toLowerCase().includes("express") || type.includes("express");
    return true;
  });

  const formattedDate = (() => {
    try {
      const d = new Date(date + "T00:00:00");
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return date;
    }
  })();

  const hasQuery = Boolean(source && destination);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP STICKY ROUTE SUMMARY CARD (Matches Mockup) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B453B] via-[#0F5C4F] to-[#146B5C] p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Selected Transit Corridor</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>{source || "Select Origin"}</span>
              <ArrowRight className="h-5 w-5 text-amber-400 inline shrink-0" />
              <span>{destination || "Select Destination"}</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/80 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-300" />
              <span>{formattedDate}</span>
              <span className="mx-1 text-white/40">•</span>
              <span>{filteredTrips.length} Bus Services Available</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-bold text-white border border-white/30 transition shadow-sm active:scale-95"
          >
            <Edit3 className="h-4 w-4 text-amber-300" />
            <span>{isEditing ? "Close Editor" : "Modify Search"}</span>
          </button>
        </div>

        {/* INLINE SEARCH DRAWER */}
        {isEditing && (
          <div className="mt-5 pt-5 border-t border-white/20 animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleEditSubmit} className="grid gap-3 sm:grid-cols-12 items-end">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1">
                  From
                </label>
                <StopAutocomplete
                  name="source"
                  placeholder="Boarding stop"
                  stops={stopNames}
                  iconType="mapPin"
                  variant="glass"
                  value={editSource}
                  onChange={setEditSource}
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1">
                  To
                </label>
                <StopAutocomplete
                  name="destination"
                  placeholder="Drop stop"
                  stops={stopNames}
                  iconType="navigation"
                  variant="glass"
                  value={editDestination}
                  onChange={setEditDestination}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-xl bg-white/20 text-white border border-white/30 py-3 px-3 text-sm font-medium focus:border-amber-400 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-inner [color-scheme:dark]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-[46px] rounded-xl bg-gradient-to-r from-[#E9A23B] to-[#F59E0B] font-bold text-sm text-white shadow-lg shadow-amber-500/30 hover:brightness-105 active:scale-95 transition"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 2. FILTER PILLS BAR (Matches Mockup) */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted mr-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${
                activeFilter === f
                  ? "bg-primary text-white shadow-primary/20 ring-2 ring-primary/20"
                  : "bg-surface text-ink/80 border border-line hover:border-primary/50 hover:bg-bg"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {activeFilter !== "All" && (
          <button
            onClick={() => setActiveFilter("All")}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset filter</span>
          </button>
        )}
      </div>

      {/* 3. TRIP CARDS LIST OR EMPTY STATE */}
      {!hasQuery && (
        <Card className="border-dashed p-10 text-center bg-surface">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <Search className="h-7 w-7" />
          </div>
          <p className="font-display text-lg font-bold text-ink">Enter your destination to begin</p>
          <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
            Please enter a boarding point and destination to find available Mo Bus services.
          </p>
        </Card>
      )}

      {hasQuery && filteredTrips.length === 0 && (
        <Card className="border-dashed p-10 text-center bg-surface">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-3">
            <Bus className="h-7 w-7" />
          </div>
          <p className="font-display text-lg font-bold text-ink">
            {activeFilter !== "All" ? `No ${activeFilter} buses found` : "No direct buses scheduled"}
          </p>
          <p className="mt-1 text-xs text-muted max-w-md mx-auto">
            {activeFilter !== "All"
              ? "Try switching to 'All' buses or searching for another travel date."
              : `We couldn't find scheduled buses from "${source}" to "${destination}" on ${formattedDate}. Check spelling or try nearby major transit hubs like Master Canteen or Baramunda.`}
          </p>
          {activeFilter !== "All" && (
            <button
              onClick={() => setActiveFilter("All")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Show All Buses</span>
            </button>
          )}
        </Card>
      )}

      {hasQuery && filteredTrips.length > 0 && (
        <div className="space-y-4">
          {filteredTrips.map((t) => (
            <BusCard
              key={t.id}
              tripId={t.tripId}
              busNumber={t.busNumber}
              busType={t.busType}
              routeName={t.routeName}
              source={t.source}
              destination={t.destination}
              departureTime={t.departureTime}
              arrivalTime={t.arrivalTime}
              fare={t.fare}
              seatsLeft={t.seatsLeft}
              status={t.status}
              stops={t.stops}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wifi,
  Zap,
  Wind,
  ShieldCheck,
  Radio,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface BusCardProps {
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

export function BusCard(props: BusCardProps) {
  const [showStops, setShowStops] = useState(false);
  const isAc = props.busType?.toLowerCase().includes("ac");
  const normalizedBusType = props.busType ? props.busType.replace(/_/g, " ") : "Express Seater";

  // Seat availability health indicator
  const seatBarColor =
    props.seatsLeft > 15
      ? "bg-emerald-500"
      : props.seatsLeft > 5
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm hover:border-primary/40 hover:shadow-xl transition-all duration-200">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        
        {/* LEFT: VERTICAL ROUTE TIMELINE */}
        <div className="flex-1 min-w-[240px]">
          <div className="relative pl-6">
            {/* Connecting vertical dashed line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 border-l-2 border-dashed border-emerald-600/50" />

            {/* Source / Boarding Stop */}
            <div className="relative pb-5">
              <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
              <div className="flex items-baseline justify-between sm:justify-start sm:gap-4">
                <span className="font-display text-sm sm:text-base font-bold text-ink">
                  {props.source}
                </span>
                <span className="text-xs font-semibold text-muted bg-bg px-2 py-0.5 rounded-md border border-line">
                  {props.departureTime}
                </span>
              </div>
            </div>

            {/* Destination / Dropping Stop */}
            <div className="relative">
              <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full bg-emerald-700 ring-4 ring-emerald-100" />
              <div className="flex items-baseline justify-between sm:justify-start sm:gap-4">
                <span className="font-display text-sm sm:text-base font-bold text-ink">
                  {props.destination}
                </span>
                <span className="text-xs font-semibold text-muted bg-bg px-2 py-0.5 rounded-md border border-line">
                  {props.arrivalTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: BUS NUMBER, TYPE BADGE & AMENITY ICONS */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-line/70 pt-3 lg:pt-0 lg:pl-6">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-base font-extrabold text-ink tracking-tight">
              {props.busNumber}
            </span>
            <span
              className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                isAc
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {normalizedBusType}
            </span>
            <StatusBadge status={props.status} />
          </div>

          <p className="text-xs text-muted font-medium mb-3 truncate max-w-xs">
            {props.routeName || "Odisha Capital Region Transit"}
          </p>

          {/* Amenities Row */}
          <div className="flex items-center gap-2 text-muted">
            <div
              title="Air Conditioned"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg border border-line/80 hover:text-primary hover:border-primary transition"
            >
              <Wind className="h-3.5 w-3.5" />
            </div>
            <div
              title="High-Speed Wi-Fi"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg border border-line/80 hover:text-primary hover:border-primary transition"
            >
              <Wifi className="h-3.5 w-3.5" />
            </div>
            <div
              title="Mobile USB Charging"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg border border-line/80 hover:text-primary hover:border-primary transition"
            >
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div
              title="Live GPS Fleet Tracking"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg border border-line/80 text-emerald-600 hover:border-emerald-600 transition"
            >
              <Radio className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <div
              title="CCTV Safety Monitored"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg border border-line/80 hover:text-primary transition"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* RIGHT: FARE, SEAT AVAILABILITY & CTA BUTTON */}
        <div className="flex shrink-0 flex-col items-start lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-line/70 pt-3 lg:pt-0 lg:pl-6 gap-3">
          <div className="lg:text-right w-full lg:w-auto">
            <div className="flex items-baseline justify-between lg:justify-end gap-2">
              <span className="text-[11px] font-semibold text-muted uppercase">Total Fare</span>
              <span className="font-display text-2xl font-black text-ink">₹{props.fare}</span>
            </div>

            {/* Seat capacity progress bar */}
            <div className="mt-1 flex items-center justify-between lg:justify-end gap-2">
              <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${seatBarColor} transition-all`}
                  style={{ width: `${Math.min(100, Math.max(10, (props.seatsLeft / 45) * 100))}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-muted">{props.seatsLeft} seats left</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            {props.stops && props.stops.length > 0 && (
              <button
                type="button"
                onClick={() => setShowStops(!showStops)}
                className="flex items-center gap-1 rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-ink hover:bg-bg transition"
              >
                <span>Stops</span>
                {showStops ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}

            <Link
              href={`/passenger/buses/${props.tripId}`}
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E9A23B] to-[#F59E0B] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-105 active:scale-95 transition"
            >
              <span>Select Seats</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* EXPANDABLE INTERMEDIATE ROUTE STOPS ACCORDION */}
      {showStops && props.stops && props.stops.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line/60 bg-bg/50 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
            Intermediate Stoppages ({props.stops.length} Stops)
          </p>
          <div className="flex flex-wrap gap-2">
            {props.stops.map((s, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs rounded-lg bg-surface border border-line px-2.5 py-1 text-ink"
              >
                <MapPin className="h-3 w-3 text-primary/70" />
                <span>{s.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

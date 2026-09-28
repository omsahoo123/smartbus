"use client";

import clsx from "clsx";
import type { Seat } from "@/types/database";
import { Disc3, UserCheck, Shield } from "lucide-react";

export function SeatMap({
  seats,
  bookedSeatIds,
  selectedSeatIds,
  onToggle,
}: {
  seats: Seat[];
  bookedSeatIds: Set<string>;
  selectedSeatIds: Set<string>;
  onToggle: (seatId: string) => void;
}) {
  const rows = Math.max(0, ...seats.map((s) => s.row_number));

  return (
    <div className="flex flex-col items-center">
      {/* SEAT LEGEND */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted bg-surface py-2.5 px-5 rounded-2xl border border-line shadow-sm">
        <Legend swatch="bg-surface border-2 border-line" label="Available" />
        <Legend swatch="bg-gradient-to-br from-[#E9A23B] to-[#F59E0B] text-white shadow-sm shadow-amber-500/30" label="Selected" />
        <Legend swatch="bg-slate-200 border border-slate-300 opacity-60" label="Occupied" />
      </div>

      {/* BUS INTERIOR CHASSIS */}
      <div className="w-full max-w-sm rounded-3xl border-2 border-primary/20 bg-surface p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* BUS ROOF / FRONT WINDSHIELD */}
        <div className="mb-6 pb-4 border-b-2 border-dashed border-line/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Front / Boarding Gate
            </span>
          </div>

          <div
            title="Driver Cabin"
            className="flex items-center gap-1.5 rounded-lg bg-bg px-2.5 py-1 text-[11px] font-bold text-ink border border-line"
          >
            <Disc3 className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "12s" }} />
            <span>Driver</span>
          </div>
        </div>

        {/* SEAT GRID */}
        <div className="flex flex-col gap-3 items-center">
          {Array.from({ length: rows }, (_, i) => i + 1).map((rowNum) => (
            <div key={rowNum} className="flex gap-2.5 items-center justify-center w-full">
              {seats
                .filter((s) => s.row_number === rowNum)
                .sort((a, b) => a.column_number - b.column_number)
                .map((seat, idx, arr) => {
                  const isBooked = bookedSeatIds.has(seat.id);
                  const isSelected = selectedSeatIds.has(seat.id);
                  // Aisle gap after 2nd seat in 2+2 layout
                  const gapAfter = arr.length === 4 && idx === 1;

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => onToggle(seat.id)}
                      className={clsx(
                        "flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold transition-all duration-150 active:scale-90",
                        gapAfter && "mr-6",
                        isBooked && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60",
                        !isBooked && isSelected && "border-amber-500 bg-gradient-to-br from-[#E9A23B] to-[#F59E0B] text-white shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 scale-105",
                        !isBooked && !isSelected && "border-line bg-surface text-ink hover:border-primary hover:bg-primary/5 hover:text-primary"
                      )}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        {/* REAR OF BUS */}
        <div className="mt-6 pt-4 border-t border-line/60 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">
            Rear of Bus
          </span>
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={clsx("h-3.5 w-3.5 rounded-md", swatch)} />
      <span>{label}</span>
    </span>
  );
}

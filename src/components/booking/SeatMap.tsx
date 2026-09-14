"use client";

import clsx from "clsx";
import type { Seat } from "@/types/database";

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
    <div>
      <div className="mb-4 flex gap-4 text-xs text-muted">
        <Legend swatch="bg-surface border border-line" label="Available" />
        <Legend swatch="bg-primary" label="Selected" />
        <Legend swatch="bg-line" label="Booked" />
      </div>

      <div className="inline-flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
        {Array.from({ length: rows }, (_, i) => i + 1).map((rowNum) => (
          <div key={rowNum} className="flex gap-2">
            {seats
              .filter((s) => s.row_number === rowNum)
              .sort((a, b) => a.column_number - b.column_number)
              .map((seat, idx, arr) => {
                const isBooked = bookedSeatIds.has(seat.id);
                const isSelected = selectedSeatIds.has(seat.id);
                // Small aisle gap after the 2nd seat in a 2+2 layout.
                const gapAfter = arr.length === 4 && idx === 1;
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={isBooked}
                    onClick={() => onToggle(seat.id)}
                    className={clsx(
                      "flex h-10 w-10 items-center justify-center rounded-md border text-xs font-medium",
                      gapAfter && "mr-4",
                      isBooked && "cursor-not-allowed border-line bg-line text-muted",
                      !isBooked && isSelected && "border-primary bg-primary text-white",
                      !isBooked && !isSelected && "border-line bg-surface text-ink hover:border-primary"
                    )}
                  >
                    {seat.seat_number}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={clsx("h-3 w-3 rounded-sm", swatch)} />
      {label}
    </span>
  );
}

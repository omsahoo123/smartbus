"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Calendar, Search, Sparkles, Navigation } from "lucide-react";
import { StopAutocomplete } from "@/components/ui/StopAutocomplete";

const POPULAR_HUBS = [
  { name: "Master Canteen", label: "Master Canteen (Station)" },
  { name: "Baramunda ISBT", label: "Baramunda ISBT" },
  { name: "Patia", label: "KIIT / Patia" },
  { name: "Puri", label: "Puri Bus Stand" },
  { name: "Badambadi", label: "Badambadi (Cuttack)" },
  { name: "Airport", label: "Bhubaneswar Airport" },
];

export function HeroSearchWidget({
  stopNames = [],
  defaultDate,
}: {
  stopNames: string[];
  defaultDate: string;
}) {
  const router = useRouter();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(defaultDate);

  const handleSwap = (e: React.MouseEvent) => {
    e.preventDefault();
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleChipClick = (stopName: string) => {
    if (!source) {
      setSource(stopName);
    } else if (!destination && source !== stopName) {
      setDestination(stopName);
    } else {
      setDestination(stopName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (destination) params.set("destination", destination);
    if (date) params.set("date", date);
    router.push(`/passenger/search?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white/15 backdrop-blur-xl border border-white/25 p-4 sm:p-6 shadow-2xl transition-all">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-12 items-end">
          {/* FROM INPUT */}
          <div className="lg:col-span-4 relative">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                From / Pickup Stop
              </label>
              <span className="text-[10px] text-white/60">Source</span>
            </div>
            <StopAutocomplete
              name="source"
              placeholder="e.g. Master Canteen"
              stops={stopNames}
              iconType="mapPin"
              variant="glass"
              value={source}
              onChange={setSource}
            />
          </div>

          {/* SWAP BUTTON */}
          <div className="hidden lg:flex lg:col-span-1 justify-center items-center pb-1">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap pickup & destination"
              aria-label="Swap pickup and destination"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-all hover:rotate-180 duration-300 shadow-md active:scale-90"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* TO INPUT */}
          <div className="lg:col-span-4 relative">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                To / Drop Stop
              </label>
              {/* Mobile swap button */}
              <button
                type="button"
                onClick={handleSwap}
                className="lg:hidden text-[11px] text-amber-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <ArrowLeftRight className="h-3 w-3" />
                <span>Swap</span>
              </button>
              <span className="hidden lg:inline text-[10px] text-white/60">Destination</span>
            </div>
            <StopAutocomplete
              name="destination"
              placeholder="e.g. Puri Bus Stand"
              stops={stopNames}
              iconType="navigation"
              variant="glass"
              value={destination}
              onChange={setDestination}
            />
          </div>

          {/* DATE PICKER */}
          <div className="lg:col-span-2 relative">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Date of Travel
              </label>
            </div>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3.5 h-4 w-4 text-white/70 pointer-events-none" />
              <input
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-white/20 text-white border border-white/30 py-3 pl-10 pr-2 text-sm font-medium focus:border-amber-400 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-inner [color-scheme:dark]"
              />
            </div>
          </div>

          {/* SEARCH CTA BUTTON */}
          <div className="lg:col-span-1 flex items-end">
            <button
              type="submit"
              className="flex w-full h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E9A23B] to-[#F59E0B] py-3 px-4 text-sm font-bold text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:brightness-105 active:scale-98 transition-all"
            >
              <Search className="h-4 w-4" />
              <span className="lg:hidden">Find Buses</span>
            </button>
          </div>
        </div>

        {/* POPULAR ROUTE CHIPS */}
        <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-white/70 flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Popular:</span>
          </span>
          {POPULAR_HUBS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              onClick={() => handleChipClick(hub.name)}
              className="rounded-full bg-white/10 hover:bg-white/25 text-white/90 border border-white/20 px-2.5 py-1 text-[11px] font-medium transition active:scale-95 flex items-center gap-1"
            >
              <span>{hub.label}</span>
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}

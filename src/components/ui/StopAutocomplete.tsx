"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Navigation } from "lucide-react";

export function StopAutocomplete({
  name,
  placeholder,
  defaultValue = "",
  value: controlledValue,
  onChange: controlledOnChange,
  stops = [],
  iconType = "mapPin",
  variant = "light",
}: {
  name: string;
  placeholder: string;
  defaultValue?: string;
  value?: string;
  onChange?: (val: string) => void;
  stops: string[];
  iconType?: "mapPin" | "navigation" | "search";
  variant?: "light" | "glass";
}) {
  const Icon = iconType === "navigation" ? Navigation : iconType === "search" ? Search : MapPin;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  const filteredStops = stops.filter((stop) =>
    stop.toLowerCase().includes(currentValue.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (stop: string) => {
    if (controlledOnChange) {
      controlledOnChange(stop);
    } else {
      setInternalValue(stop);
    }
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (controlledOnChange) {
      controlledOnChange(val);
    } else {
      setInternalValue(val);
    }
    setIsOpen(true);
  };

  const isGlass = variant === "glass";

  return (
    <div className="relative flex items-center w-full" ref={wrapperRef}>
      <Icon
        className={`absolute left-3.5 h-4 w-4 pointer-events-none transition-colors ${
          isGlass ? "text-white/70" : "text-muted"
        }`}
      />
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        value={currentValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
        className={`w-full rounded-xl py-3 pl-10 pr-3 text-sm font-medium transition-all ${
          isGlass
            ? "bg-white/20 text-white placeholder:text-white/60 border border-white/30 focus:border-amber-400 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-inner"
            : "border border-line bg-bg text-ink placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
        }`}
      />

      {isOpen && currentValue.trim().length > 0 && filteredStops.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full rounded-2xl border border-line/80 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted bg-slate-50/80 border-b border-line/50">
            Suggested Transit Stops
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filteredStops.map((stop) => (
              <li
                key={stop}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                onClick={() => handleSelect(stop)}
              >
                <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                <span className="truncate">{stop}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && currentValue.trim().length > 0 && filteredStops.length === 0 && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full rounded-2xl border border-line/80 bg-white/95 backdrop-blur-md shadow-2xl p-4 text-center text-xs text-muted">
          No matching stop found. You can still search directly!
        </div>
      )}
    </div>
  );
}

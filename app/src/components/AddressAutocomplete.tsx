"use client";

import { useState, useRef, useCallback } from "react";
import { geocodeSearch, type GeocodeSuggestion } from "@/lib/mapbox/geocode";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coords?: [number, number]) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Search address...",
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleInput = useCallback(
    (text: string) => {
      onChange(text);
      clearTimeout(timerRef.current);

      if (text.length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      timerRef.current = setTimeout(async () => {
        const results = await geocodeSearch(text);
        setSuggestions(results);
        setOpen(results.length > 0);
      }, 300);
    },
    [onChange]
  );

  const handleSelect = (s: GeocodeSuggestion) => {
    onChange(s.place_name, s.center);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        className="w-full bg-dark3 border border-bd rounded-xl px-3 py-3 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-bd rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors border-b border-bd last:border-b-0"
            >
              <div className="font-heading font-semibold text-xs text-t1">{s.text}</div>
              <div className="text-[10px] text-t2 mt-0.5 truncate">{s.place_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

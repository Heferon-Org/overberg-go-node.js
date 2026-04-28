"use client";

import { useState } from "react";
import { useLocationStore } from "@/lib/store";

const areas = [
  { name: "Struisbaai", sub: "Harbour · Beach · North", emoji: "🏖️" },
  { name: "L'Agulhas", sub: "Lighthouse · Southernmost tip", emoji: "💡" },
  { name: "Arniston", sub: "Kassiesbaai · Roman Beach", emoji: "🏘️" },
  { name: "Bredasdorp", sub: "Town centre · Museum", emoji: "🏛️" },
];

export function AreaSelector() {
  const [open, setOpen] = useState(false);
  const { area, setArea } = useLocationStore();

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-left">
        <div className="text-[9px] font-bold uppercase tracking-widest text-t3">
          Delivering to
        </div>
        <div className="flex items-center gap-1.5 font-heading font-bold text-[14.5px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#1E9E5A">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span>{area}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(17,24,39,0.35)" strokeWidth="1.5">
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white border-t border-bd rounded-t-3xl w-full max-w-lg p-6 pb-10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-5" />
            <h2 className="font-heading font-black text-lg mb-4">Choose your area</h2>
            <div className="space-y-2">
              {areas.map((a) => (
                <button
                  key={a.name}
                  onClick={() => {
                    setArea(a.name);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    area === a.name
                      ? "bg-primary/10 border-primary/30"
                      : "bg-dark3 border-bd hover:border-bd2"
                  }`}
                >
                  <span className="text-2xl">{a.emoji}</span>
                  <div className="text-left">
                    <div className="font-heading font-bold text-sm">{a.name}</div>
                    <div className="text-[11px] text-t2">{a.sub}</div>
                  </div>
                  {area === a.name && (
                    <span className="ml-auto text-primary font-bold text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

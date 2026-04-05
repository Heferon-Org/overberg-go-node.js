"use client";

import { useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/lib/store";

const rideTypes = [
  { name: "GoRide", emoji: "🚗", price: 55, eta: "4 min · 1-3 pax" },
  { name: "GoPremium", emoji: "🚙", price: 85, eta: "6 min · 1-4 pax" },
  { name: "GoXL", emoji: "🚐", price: 110, eta: "8 min · 5-7 pax" },
];

const quickPlaces = [
  { emoji: "🏠", name: "Home" },
  { emoji: "🛒", name: "Spar" },
  { emoji: "🏥", name: "Clinic" },
  { emoji: "✈️", name: "Airport" },
  { emoji: "🏖️", name: "Beach" },
  { emoji: "💡", name: "Lighthouse" },
];

export default function RidePage() {
  const [selected, setSelected] = useState(0);
  const showToast = useToastStore((s) => s.show);
  const ride = rideTypes[selected];

  return (
    <div>
      <div className="px-[18px] pt-2 pb-3.5">
        <h1 className="font-heading font-black text-[22px] tracking-tight">
          Book a <span className="text-primary">Ride</span>
        </h1>
      </div>

      {/* Map zone */}
      <div className="mx-[18px] h-[180px] rounded-[18px] bg-gradient-to-br from-[#0E2A3A] to-dark relative overflow-hidden border border-bd mb-4">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute top-1/4 left-0 right-0 h-[1.5px] bg-primary/70" />
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-primary/70" />
          <div className="absolute top-3/4 left-0 right-0 h-[1.5px] bg-primary/70" />
          <div className="absolute left-1/4 top-0 bottom-0 w-[1.5px] bg-primary/50" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-primary/50" />
          <div className="absolute left-3/4 top-0 bottom-0 w-[1.5px] bg-primary/50" />
        </div>
        <div className="absolute top-[28%] left-[38%] flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow-lg" />
          <div className="mt-1 bg-dark/80 backdrop-blur px-2 py-0.5 rounded text-[9px] font-heading font-bold">Marine 127</div>
        </div>
        <div className="absolute top-[55%] left-[62%] flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-sea border-2 border-white shadow-lg" />
          <div className="mt-1 bg-dark/80 backdrop-blur px-2 py-0.5 rounded text-[9px] font-heading font-bold">Spar Struisbaai</div>
        </div>
        <div className="absolute left-[48%] top-[40%] text-2xl animate-car">🚗</div>
        <div className="absolute top-3 right-3.5 bg-primary/90 backdrop-blur rounded-xl px-3.5 py-2">
          <div className="font-heading font-extrabold text-[13px] text-white">3 min away</div>
          <div className="text-[10px] text-white/80">Nearest driver</div>
        </div>
      </div>

      {/* Address inputs */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div className="font-heading font-semibold text-sm text-white">Marine 127, Struisbaai</div>
        </div>
        <div className="w-[1.5px] h-4 bg-bd2 ml-[5px] my-1" />
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-sea" />
          <div className="font-heading font-semibold text-sm text-t3">Where to?</div>
        </div>
      </div>

      {/* Quick places */}
      <div className="flex gap-2 overflow-x-auto px-[18px] pb-4 no-scrollbar">
        {quickPlaces.map((p) => (
          <div
            key={p.name}
            className="shrink-0 flex items-center gap-2 bg-dark2 border border-bd rounded-full px-4 py-2.5"
          >
            <span className="text-base">{p.emoji}</span>
            <span className="font-heading font-semibold text-xs">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Ride types */}
      <div className="px-[18px]">
        <h2 className="font-heading font-black text-base mb-3">Choose ride type</h2>
        <div className="flex gap-3 mb-4">
          {rideTypes.map((rt, i) => (
            <button
              key={rt.name}
              onClick={() => setSelected(i)}
              className={`flex-1 bg-dark2 border rounded-[18px] p-3.5 text-center transition-all ${
                selected === i ? "border-primary bg-primary/[0.06]" : "border-bd"
              }`}
            >
              <div className="text-2xl mb-1.5">{rt.emoji}</div>
              <div className="font-heading font-bold text-xs">{rt.name}</div>
              <div className="font-heading font-black text-primary text-sm mt-0.5">R{rt.price}</div>
              <div className="text-[10px] text-t2 mt-1">{rt.eta}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Driver card */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-dark3 flex items-center justify-center text-2xl">👤</div>
        <div className="flex-1">
          <div className="font-heading font-bold text-sm">Sipho Ndlovu</div>
          <div className="text-xs text-t2">★ 4.93 <span className="font-normal">(847 trips)</span></div>
          <div className="text-[10px] text-t3 mt-0.5">CA 234 567</div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">📞</div>
          <div className="w-10 h-10 rounded-xl bg-sea/10 border border-sea/25 flex items-center justify-center">💬</div>
        </div>
      </div>

      <div className="px-[18px] pb-24">
        <button
          onClick={() => showToast(`✓ Booking ${ride.name} — Driver Sipho is 3 min away`)}
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-[17px] active:bg-primary-dark active:scale-[0.98] transition-all"
        >
          Book {ride.name} · R{ride.price}
        </button>
      </div>
    </div>
  );
}

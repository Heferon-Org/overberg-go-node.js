"use client";

import { useState } from "react";
import { Chip } from "@/components/Chip";
import { stays } from "@/lib/data";

const filters = ["All", "🏡 Self-Catering", "🛎️ B&B", "🏨 Boutique", "🏕️ Camping"];

export default function StaysPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered =
    activeFilter === "All"
      ? stays
      : stays.filter((s) => {
          const tag = activeFilter.replace(/^[^\s]+\s/, "");
          return s.tag.toLowerCase().includes(tag.toLowerCase());
        });

  return (
    <div>
      <div className="px-[18px] pt-3 pb-3.5">
        <h1 className="font-heading font-black text-[22px] tracking-tight mb-1">
          Guest Houses <span className="text-primary">&amp; Stays</span>
        </h1>
        <div className="text-xs text-t2">Local accommodation in the Overberg</div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-[18px] pb-4 no-scrollbar">
        {filters.map((f) => (
          <Chip key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>

      <div className="px-[18px] pb-24">
        {filtered.map((stay) => (
          <div key={stay.id} className="bg-dark2 border border-bd rounded-[18px] overflow-hidden mb-3">
            <div
              className="h-[120px] relative flex items-center justify-center text-[48px]"
              style={{ background: stay.bg }}
            >
              {stay.emoji}
              <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white/90">
                {stay.location}
              </div>
              <div className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur border border-white/[0.13] rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white">
                ★ {stay.rating}
              </div>
            </div>
            <div className="p-3.5">
              <div className="font-heading font-bold text-sm">{stay.name}</div>
              <div className="text-[11px] text-t2 mt-1 leading-relaxed">{stay.description}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-t2 mt-2">
                <span>{stay.meta}</span>
                <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
                <span className="font-heading font-bold text-primary">{stay.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

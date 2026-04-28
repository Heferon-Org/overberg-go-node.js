"use client";

import { useState } from "react";
import { Chip } from "@/components/Chip";
import { useToastStore } from "@/lib/store";
import { experiences } from "@/lib/data";

const filters = ["All", "⛵ Sea", "🐕 Pets", "🏡 Stays", "🎣 Fishing", "🚴 Active"];

export default function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const showToast = useToastStore((s) => s.show);

  const sections = [...new Set(experiences.map((e) => e.section))];

  const filtered = activeFilter === "All"
    ? experiences
    : experiences.filter((e) => {
        const tag = activeFilter.replace(/^[^\s]+\s/, "").toLowerCase();
        return (
          e.section.toLowerCase().includes(tag) ||
          e.name.toLowerCase().includes(tag) ||
          e.description.toLowerCase().includes(tag)
        );
      });

  const filteredSections = sections.filter((s) =>
    filtered.some((e) => e.section === s)
  );

  return (
    <div>
      <div className="px-[18px] pt-3 pb-3.5">
        <h1 className="font-heading font-black text-[22px] tracking-tight mb-1">
          Experiences <span className="text-primary">& Services</span>
        </h1>
        <div className="text-xs text-t2">Struisbaai · L&apos;Agulhas · Arniston</div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-[18px] pb-4 no-scrollbar">
        {filters.map((f) => (
          <Chip key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>

      <div className="px-[18px] pb-24">
        {filteredSections.map((section) => {
          const sectionExps = filtered.filter((e) => e.section === section);
          const first = sectionExps[0];
          return (
            <div key={section}>
              <div
                className={`font-heading font-extrabold text-sm mb-2.5 mt-5 first:mt-0 flex items-center gap-1.5 ${first.sectionColor}`}
              >
                {first.sectionEmoji} {section}
              </div>
              {sectionExps.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-dark2 border border-bd rounded-[18px] overflow-hidden mb-3 shadow-sm"
                >
                  <div
                    className="h-[100px] relative flex items-center justify-center text-[44px]"
                    style={{ background: exp.bg }}
                  >
                    {exp.emoji}
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white">
                      {exp.badge}
                    </div>
                  </div>
                  <div className="p-3.5">
                    <div className="font-heading font-bold text-sm">{exp.name}</div>
                    <div className="text-[11px] text-t2 mt-1 leading-relaxed">{exp.description}</div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-[11px] text-t2">🕐 {exp.duration}</span>
                      <span className="font-heading font-bold text-primary text-sm">{exp.price}</span>
                      <button
                        onClick={() => showToast(`✓ ${exp.buttonText} — ${exp.name}`)}
                        className="ml-auto bg-primary text-white font-heading font-bold text-[11px] px-4 py-2 rounded-xl active:bg-primary-dark transition-colors"
                      >
                        {exp.buttonText}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

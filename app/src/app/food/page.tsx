"use client";

import { useEffect, useState } from "react";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Chip } from "@/components/Chip";
import { fetchRestaurants, type Restaurant } from "@/lib/data";

const filters = ["🍽️ All", "🐟 Seafood", "🍕 Italian", "🍺 Pub", "☕ Café", "🇿🇦 SA"];

export default function FoodPage() {
  const [activeFilter, setActiveFilter] = useState("🍽️ All");
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    fetchRestaurants().then(setRestaurants);
  }, []);

  const filtered = restaurants.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q);
    }
    if (activeFilter === "🍽️ All") return true;
    const tag = activeFilter.replace(/^[^\s]+\s/, "");
    return r.tag.toLowerCase().includes(tag.toLowerCase());
  });

  return (
    <div>
      <div className="px-[18px] pt-3 pb-3.5">
        <h1 className="font-heading font-black text-[22px] tracking-tight mb-3">
          Restaurants <span className="text-primary">near you</span>
        </h1>
        <div className="flex items-center gap-2.5 bg-dark3 border-[1.5px] border-bd rounded-[14px] px-4 py-3.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(17,24,39,0.3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-t1 placeholder:text-t3 outline-none flex-1"
          />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-[18px] pb-4 no-scrollbar">
        {filters.map((f) => (
          <Chip key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>
      <div className="px-[18px]">
        {filtered.map((r) => (
          <RestaurantCard key={r.id} r={r} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-t3 text-sm">No restaurants match your search</div>
        )}
      </div>
    </div>
  );
}

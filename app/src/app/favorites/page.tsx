"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFavoritesStore, useToastStore } from "@/lib/store";
import {
  fetchRestaurants,
  fetchExperiences,
  fetchStays,
  type Restaurant,
  type Experience,
  type Stay,
} from "@/lib/data";

const tabs = ["Restaurants", "Experiences", "Stays"];

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState("Restaurants");
  const { restaurantIds, experienceIds, stayIds, toggleRestaurant, toggleExperience, toggleStay } =
    useFavoritesStore();
  const showToast = useToastStore((s) => s.show);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);

  useEffect(() => {
    Promise.all([fetchRestaurants(), fetchExperiences(), fetchStays()]).then(
      ([r, e, s]) => {
        setRestaurants(r);
        setExperiences(e);
        setStays(s);
      }
    );
  }, []);

  const favRestaurants = restaurants.filter((r) => restaurantIds.includes(r.id));
  const favExperiences = experiences.filter((e) => experienceIds.includes(e.id));
  const favStays = stays.filter((s) => stayIds.includes(s.id));

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">
          My <span className="text-primary">Favorites</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bd mx-[18px] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 font-heading font-bold text-[13px] relative transition-colors ${
              activeTab === tab ? "text-primary" : "text-t3"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="px-[18px] pb-24">
        {activeTab === "Restaurants" && (
          <>
            {favRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🍽️</div>
                <div className="font-heading font-bold text-sm text-t2">No favorite restaurants yet</div>
                <Link href="/food" className="text-primary font-heading font-bold text-xs mt-2 block">
                  Browse restaurants →
                </Link>
              </div>
            ) : (
              favRestaurants.map((r) => (
                <div key={r.id} className="bg-dark2 border border-bd rounded-[18px] overflow-hidden mb-3 shadow-sm">
                  <div className="h-[100px] relative flex items-center justify-center text-[48px]" style={{ background: r.bg }}>
                    {r.emoji}
                    <button
                      onClick={() => {
                        toggleRestaurant(r.id);
                        showToast(`Removed ${r.name} from favorites`);
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-coral text-sm shadow-sm"
                    >
                      ♥
                    </button>
                  </div>
                  <Link href={`/food/${r.id}`} className="block p-3.5">
                    <div className="font-heading font-bold text-sm">{r.name}</div>
                    <div className="text-[11px] text-t2 mt-1">{r.subtitle}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-t2 mt-1.5">
                      <span>★ {r.rating}</span>
                      <span className="w-[3px] h-[3px] rounded-full bg-black/15" />
                      <span>🕐 {r.time}</span>
                      <span className="w-[3px] h-[3px] rounded-full bg-black/15" />
                      <span>{r.deliveryFee}</span>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "Experiences" && (
          <>
            {favExperiences.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">⚓</div>
                <div className="font-heading font-bold text-sm text-t2">No favorite experiences yet</div>
                <Link href="/explore" className="text-primary font-heading font-bold text-xs mt-2 block">
                  Explore experiences →
                </Link>
              </div>
            ) : (
              favExperiences.map((e) => (
                <div key={e.id} className="bg-dark2 border border-bd rounded-[18px] overflow-hidden mb-3 shadow-sm">
                  <div className="h-[80px] relative flex items-center justify-center text-[36px]" style={{ background: e.bg }}>
                    {e.emoji}
                    <button
                      onClick={() => {
                        toggleExperience(e.id);
                        showToast(`Removed ${e.name} from favorites`);
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-coral text-sm shadow-sm"
                    >
                      ♥
                    </button>
                  </div>
                  <div className="p-3.5">
                    <div className="font-heading font-bold text-sm">{e.name}</div>
                    <div className="text-[11px] text-t2 mt-1">{e.description.slice(0, 80)}...</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-heading font-bold text-primary text-sm">{e.price}</span>
                      <span className="text-[11px] text-t2">🕐 {e.duration}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "Stays" && (
          <>
            {favStays.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🏡</div>
                <div className="font-heading font-bold text-sm text-t2">No favorite stays yet</div>
                <Link href="/stays" className="text-primary font-heading font-bold text-xs mt-2 block">
                  Browse stays →
                </Link>
              </div>
            ) : (
              favStays.map((s) => (
                <div key={s.id} className="bg-dark2 border border-bd rounded-[18px] overflow-hidden mb-3 shadow-sm">
                  <div className="h-[80px] relative flex items-center justify-center text-[36px]" style={{ background: s.bg }}>
                    {s.emoji}
                    <button
                      onClick={() => {
                        toggleStay(s.id);
                        showToast(`Removed ${s.name} from favorites`);
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-coral text-sm shadow-sm"
                    >
                      ♥
                    </button>
                  </div>
                  <div className="p-3.5">
                    <div className="font-heading font-bold text-sm">{s.name}</div>
                    <div className="text-[11px] text-t2 mt-1">{s.description.slice(0, 80)}...</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-heading font-bold text-primary text-sm">{s.price}</span>
                      <span className="text-[11px] text-t2">📍 {s.location}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

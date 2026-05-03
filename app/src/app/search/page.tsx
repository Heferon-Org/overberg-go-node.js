"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchRestaurants,
  fetchExperiences,
  fetchStays,
  type Restaurant,
  type Experience,
  type Stay,
} from "@/lib/data";

const recentSearches = ["Calamari", "Whale watching", "L'Agulhas", "Dog walker"];
const trendingSearches = ["Harbour Café", "Sea adventures", "Fish & chips", "Braai pack"];

type ResultCategory = "restaurant" | "experience" | "stay";

interface SearchResult {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  category: ResultCategory;
  href: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
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

  const getResults = (): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    restaurants.forEach((r) => {
      if (
        r.name.toLowerCase().includes(q) ||
        r.tag.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q)
      ) {
        results.push({
          id: r.id,
          name: r.name,
          subtitle: `${r.tag} · ★ ${r.rating} · ${r.time}`,
          emoji: r.emoji,
          category: "restaurant",
          href: `/food/${r.id}`,
        });
      }
    });

    experiences.forEach((e) => {
      if (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.section.toLowerCase().includes(q)
      ) {
        results.push({
          id: e.id,
          name: e.name,
          subtitle: `${e.section} · ${e.price}`,
          emoji: e.emoji,
          category: "experience",
          href: "/explore",
        });
      }
    });

    stays.forEach((s) => {
      if (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q)
      ) {
        results.push({
          id: s.id,
          name: s.name,
          subtitle: `${s.location} · ${s.price}`,
          emoji: s.emoji,
          category: "stay",
          href: "/stays",
        });
      }
    });

    return results;
  };

  const results = getResults();
  const showSuggestions = !query.trim();

  const categoryLabels: Record<ResultCategory, { label: string; color: string }> = {
    restaurant: { label: "Food", color: "bg-coral/10 text-coral" },
    experience: { label: "Experience", color: "bg-sea/10 text-sea" },
    stay: { label: "Stay", color: "bg-primary/10 text-primary" },
  };

  return (
    <div>
      {/* Search header */}
      <div className="px-[18px] pt-3 pb-3">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
          >
            ←
          </Link>
          <div className="flex-1 flex items-center gap-2.5 bg-dark3 border-[1.5px] border-bd rounded-[14px] px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(17,24,39,0.3)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search food, rides, experiences..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="bg-transparent text-sm text-t1 placeholder:text-t3 outline-none flex-1"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-t3 text-sm">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-[18px] pb-24">
        {showSuggestions ? (
          <>
            {/* Recent */}
            <div className="mb-5">
              <h3 className="font-heading font-bold text-xs text-t3 uppercase tracking-wider mb-2.5">
                Recent Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="flex items-center gap-1.5 bg-dark2 border border-bd rounded-full px-3.5 py-2 text-xs font-heading font-semibold text-t2"
                  >
                    <span className="text-t3">🕐</span> {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending */}
            <div>
              <h3 className="font-heading font-bold text-xs text-t3 uppercase tracking-wider mb-2.5">
                Trending
              </h3>
              <div className="space-y-1">
                {trendingSearches.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="w-full flex items-center gap-3 py-2.5 text-left"
                  >
                    <span className="font-heading font-black text-sm text-t3 w-5">{i + 1}</span>
                    <span className="text-sm">{s}</span>
                    <span className="text-[10px] text-primary font-heading font-bold ml-auto">🔥</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            <div className="text-[11px] text-t3 font-heading font-semibold mb-2">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </div>
            {results.map((r) => (
              <Link
                key={`${r.category}-${r.id}`}
                href={r.href}
                className="flex items-center gap-3 bg-dark2 border border-bd rounded-[16px] p-3.5 active:bg-black/[0.02] transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-dark3 flex items-center justify-center text-xl">
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-sm">{r.name}</div>
                  <div className="text-[11px] text-t2 mt-0.5">{r.subtitle}</div>
                </div>
                <span
                  className={`text-[9px] font-heading font-bold px-2 py-0.5 rounded-full ${categoryLabels[r.category].color}`}
                >
                  {categoryLabels[r.category].label}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-heading font-bold text-sm text-t2">
              No results for &ldquo;{query}&rdquo;
            </div>
            <div className="text-[11px] text-t3 mt-1">Try a different search term</div>
          </div>
        )}
      </div>
    </div>
  );
}

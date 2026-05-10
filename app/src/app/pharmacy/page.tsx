"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Pharmacy = {
  id: string;
  name: string;
  emoji: string | null;
  image_url: string | null;
  rating: number;
  delivery_time: string | null;
  delivery_fee: number;
  location: string | null;
  is_open: boolean;
};

export default function PharmacyPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("merchants")
      .select("id, name, emoji, image_url, rating, delivery_time, delivery_fee, location, is_open")
      .eq("merchant_type", "pharmacy")
      .order("rating", { ascending: false })
      .then(({ data }) => {
        if (data) setPharmacies(data);
      });
  }, [supabase]);

  const filtered = pharmacies.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-2xl font-display font-bold mb-1">Pharmacy</h1>
      <p className="text-sm text-t3 mb-4">Get medications delivered to your door</p>

      <input
        type="text"
        placeholder="Search pharmacies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm mb-4"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-t3">
          <p className="text-4xl mb-2">💊</p>
          <p className="font-medium">No pharmacies available yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/pharmacy/${p.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-2xl">
                  {p.emoji || "💊"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    {!p.is_open && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Closed</span>
                    )}
                  </div>
                  <p className="text-xs text-t3 truncate">{p.location}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-t3">
                    <span>⭐ {p.rating.toFixed(1)}</span>
                    <span>{p.delivery_time || "30-45 min"}</span>
                    <span>R{p.delivery_fee.toFixed(0)} delivery</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToastStore } from "@/lib/store";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  rating: number;
  review_count: number;
  is_open: boolean;
  area: string;
  owner_id: string | null;
  location: string | null;
}

export default function AdminMerchantsPage() {
  const showToast = useToastStore((s) => s.show);
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getClient();
    client
      .from("restaurants")
      .select("id, name, slug, emoji, rating, review_count, is_open, area, owner_id, location")
      .order("name")
      .then(({ data }) => {
        setRestaurants((data || []) as RestaurantRow[]);
        setLoading(false);
      });
  }, []);

  async function toggleOpen(id: string, current: boolean) {
    const client = getClient();
    await client.from("restaurants").update({ is_open: !current }).eq("id", id);
    setRestaurants((prev) => prev.map((r) => (r.id === id ? { ...r, is_open: !current } : r)));
    showToast(`Restaurant ${!current ? "opened" : "closed"}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-2xl animate-pulse">🏪</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-black text-xl text-[#111827]">Merchant Management</h1>
        <span className="text-xs text-[rgba(17,24,39,0.55)]">{restaurants.length} restaurants</span>
      </div>

      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.07)] bg-[#f7f8fa]">
                <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Restaurant</th>
                <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Area</th>
                <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Rating</th>
                <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Reviews</th>
                <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Owner</th>
                <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Status</th>
                <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id} className="border-b border-[rgba(0,0,0,0.04)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{r.emoji || "🍽️"}</span>
                      <div>
                        <div className="font-heading font-bold">{r.name}</div>
                        <div className="text-[rgba(17,24,39,0.45)]">{r.location || r.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.area}</td>
                  <td className="px-4 py-3 font-heading font-bold">★ {r.rating.toFixed(1)}</td>
                  <td className="px-4 py-3">{r.review_count}</td>
                  <td className="px-4 py-3 text-[rgba(17,24,39,0.55)] font-mono">{r.owner_id ? r.owner_id.slice(0, 8) + "..." : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-heading font-bold ${r.is_open ? "text-[#1E9E5A]" : "text-[#E8503A]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.is_open ? "bg-[#1E9E5A]" : "bg-[#E8503A]"}`} />
                      {r.is_open ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleOpen(r.id, r.is_open)} className="px-2.5 py-1 rounded-lg bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-[10px] font-heading font-bold hover:bg-[#e5e7eb]">
                      {r.is_open ? "Force close" : "Open"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

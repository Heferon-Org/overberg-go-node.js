"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LaundryMerchant = {
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

export default function LaundryPage() {
  const [merchants, setMerchants] = useState<LaundryMerchant[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("merchants")
      .select("id, name, emoji, image_url, rating, delivery_time, delivery_fee, location, is_open")
      .eq("merchant_type", "laundry")
      .order("rating", { ascending: false })
      .then(({ data }) => { if (data) setMerchants(data); });
  }, [supabase]);

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Laundry</h1>
          <p className="text-sm text-t3">Pickup, wash & deliver back to you</p>
        </div>
        <button
          onClick={() => router.push("/laundry/schedule")}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
        >
          Schedule Pickup
        </button>
      </div>

      {merchants.length === 0 ? (
        <div className="text-center py-12 text-t3">
          <p className="text-4xl mb-2">👔</p>
          <p className="font-medium">No laundry services available yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {merchants.map((m) => (
            <Link
              key={m.id}
              href={`/laundry/schedule?merchant=${m.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                  {m.emoji || "👔"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{m.name}</h3>
                    {!m.is_open && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Closed</span>
                    )}
                  </div>
                  <p className="text-xs text-t3 truncate">{m.location}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-t3">
                    <span>⭐ {m.rating.toFixed(1)}</span>
                    <span>Pickup + delivery included</span>
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

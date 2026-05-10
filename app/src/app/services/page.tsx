"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type MyRequest = {
  id: string;
  category: string;
  title: string;
  status: string;
  budget_max_cents: number;
  created_at: string;
};

const CATEGORIES = [
  { value: "plumber", emoji: "🔧", label: "Plumber" },
  { value: "electrician", emoji: "⚡", label: "Electrician" },
  { value: "painter", emoji: "🎨", label: "Painter" },
  { value: "gardener", emoji: "🌱", label: "Gardener" },
  { value: "cleaner", emoji: "🧹", label: "Cleaner" },
  { value: "handyman", emoji: "🔨", label: "Handyman" },
  { value: "locksmith", emoji: "🔑", label: "Locksmith" },
  { value: "pest_control", emoji: "🐛", label: "Pest Control" },
  { value: "moving", emoji: "🚚", label: "Moving" },
  { value: "appliance_repair", emoji: "🔌", label: "Appliance Repair" },
];

export default function ServicesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("service_requests")
        .select("id, category, title, status, budget_max_cents, created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setMyRequests(data as MyRequest[]);
    })();
  }, [supabase]);

  const getCategoryEmoji = (cat: string) => CATEGORIES.find((c) => c.value === cat)?.emoji || "🔧";

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-bold">Home Services</h1>
        <button
          onClick={() => router.push("/services/post")}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
        >
          + Post Task
        </button>
      </div>
      <p className="text-sm text-t3 mb-6">Find local pros — get competitive bids</p>

      <div className="grid grid-cols-5 gap-3 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => router.push(`/services/post?category=${cat.value}`)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
              {cat.emoji}
            </div>
            <span className="text-xs text-t3 text-center leading-tight">{cat.label}</span>
          </button>
        ))}
      </div>

      {myRequests.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-3">My Requests</h2>
          <div className="space-y-3">
            {myRequests.map((req) => (
              <Link
                key={req.id}
                href={`/services/${req.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryEmoji(req.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{req.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${
                        req.status === "completed" ? "bg-green-100 text-green-700" :
                        req.status === "cancelled" ? "bg-red-100 text-red-700" :
                        req.status === "accepted" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-t3">
                        {new Date(req.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-sm font-semibold">Budget: R{(req.budget_max_cents / 100).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

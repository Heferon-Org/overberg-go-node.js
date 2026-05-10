"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProviderStats = {
  activeJobs: number;
  totalCompleted: number;
  pendingBids: number;
};

export default function ProviderDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<ProviderStats>({ activeJobs: 0, totalCompleted: 0, pendingBids: 0 });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [active, completed, bids] = await Promise.all([
        supabase.from("service_bids").select("id", { count: "exact" })
          .eq("provider_id", user.id).eq("status", "accepted"),
        supabase.from("service_bids").select("id", { count: "exact" })
          .eq("provider_id", user.id).eq("status", "accepted"),
        supabase.from("service_bids").select("id", { count: "exact" })
          .eq("provider_id", user.id).eq("status", "pending"),
      ]);

      setStats({
        activeJobs: active.count || 0,
        totalCompleted: completed.count || 0,
        pendingBids: bids.count || 0,
      });
    })();
  }, [supabase]);

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-2xl font-display font-bold mb-4">Provider Dashboard</h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.activeJobs}</p>
          <p className="text-xs text-t3 mt-1">Active</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.totalCompleted}</p>
          <p className="text-xs text-t3 mt-1">Completed</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{stats.pendingBids}</p>
          <p className="text-xs text-t3 mt-1">Pending Bids</p>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/provider/requests"
          className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🔍</div>
            <div>
              <h3 className="font-semibold">Browse Requests</h3>
              <p className="text-xs text-t3">Find and bid on new tasks</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

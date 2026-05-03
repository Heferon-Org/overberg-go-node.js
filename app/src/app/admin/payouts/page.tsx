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

interface EarningRow {
  driver_id: string;
  total: number;
  trips: number;
  driver_name: string | null;
}

export default function AdminPayoutsPage() {
  const showToast = useToastStore((s) => s.show);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEarnings();
  }, []);

  async function fetchEarnings() {
    const client = getClient();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const { data } = await client
      .from("driver_earnings")
      .select("driver_id, amount, type")
      .gte("created_at", weekAgo);

    const rows = (data || []) as { driver_id: string; amount: number; type: string }[];

    const grouped = new Map<string, { total: number; trips: number }>();
    for (const r of rows) {
      const entry = grouped.get(r.driver_id) || { total: 0, trips: 0 };
      entry.total += r.amount;
      if (r.type === "trip") entry.trips++;
      grouped.set(r.driver_id, entry);
    }

    const driverIds = Array.from(grouped.keys());
    let names: Record<string, string | null> = {};
    if (driverIds.length > 0) {
      const { data: profiles } = await client
        .from("profiles")
        .select("id, full_name")
        .in("id", driverIds);
      for (const p of (profiles || []) as { id: string; full_name: string | null }[]) {
        names[p.id] = p.full_name;
      }
    }

    const result: EarningRow[] = Array.from(grouped.entries())
      .map(([id, e]) => ({
        driver_id: id,
        total: e.total,
        trips: e.trips,
        driver_name: names[id] || null,
      }))
      .sort((a, b) => b.total - a.total);

    setEarnings(result);
    setLoading(false);
  }

  function markPaid(driverId: string) {
    setPaidIds((prev) => new Set([...prev, driverId]));
    showToast("✓ Marked as paid (manual EFT)");
  }

  const totalPayout = earnings.reduce((sum, e) => sum + e.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-2xl animate-pulse">💳</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading font-black text-xl text-[#111827]">Weekly Payouts</h1>
          <p className="text-xs text-[rgba(17,24,39,0.55)] mt-0.5">Last 7 days · Friday EFT</p>
        </div>
        <div className="bg-[#1E9E5A]/10 border border-[#1E9E5A]/25 rounded-xl px-4 py-2 text-center">
          <div className="font-heading font-black text-lg text-[#1E9E5A]">R{totalPayout.toLocaleString()}</div>
          <div className="text-[10px] text-[rgba(17,24,39,0.55)]">Total payout</div>
        </div>
      </div>

      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl overflow-hidden">
        {earnings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-2xl mb-2">📭</div>
            <div className="text-sm text-[rgba(17,24,39,0.55)]">No earnings this period</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.07)] bg-[#f7f8fa]">
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Driver</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Trips</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Amount</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Status</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Action</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e) => (
                  <tr key={e.driver_id} className="border-b border-[rgba(0,0,0,0.04)]">
                    <td className="px-4 py-3 font-heading font-bold">{e.driver_name || e.driver_id.slice(0, 12)}</td>
                    <td className="px-4 py-3">{e.trips}</td>
                    <td className="px-4 py-3 font-heading font-bold text-[#1E9E5A]">R{e.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {paidIds.has(e.driver_id) ? (
                        <span className="text-[#1E9E5A] font-heading font-bold">✓ Paid</span>
                      ) : (
                        <span className="text-[#F5A623] font-heading font-bold">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!paidIds.has(e.driver_id) && (
                        <button onClick={() => markPaid(e.driver_id)} className="px-3 py-1.5 rounded-xl bg-[#1E9E5A] text-white text-[10px] font-heading font-bold">
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

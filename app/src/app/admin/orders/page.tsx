"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Order, OrderStatus } from "@/lib/supabase/types";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const STATUSES: OrderStatus[] = ["placed", "confirmed", "preparing", "ready", "picked_up", "on_the_way", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/25",
  confirmed: "bg-[#0E9EC2]/10 text-[#0E9EC2] border-[#0E9EC2]/25",
  preparing: "bg-[#0E9EC2]/10 text-[#0E9EC2] border-[#0E9EC2]/25",
  ready: "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/25",
  picked_up: "bg-[#1E9E5A]/10 text-[#1E9E5A] border-[#1E9E5A]/25",
  on_the_way: "bg-[#1E9E5A]/10 text-[#1E9E5A] border-[#1E9E5A]/25",
  delivered: "bg-[#1E9E5A]/15 text-[#1E9E5A] border-[#1E9E5A]/30",
  cancelled: "bg-[#E8503A]/10 text-[#E8503A] border-[#E8503A]/25",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const client = getClient();

    async function fetch() {
      setLoading(true);
      let query = client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data } = await query;
      setOrders((data || []) as Order[]);
      setLoading(false);
    }

    fetch();
  }, [statusFilter, page]);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-black text-xl text-[#111827]">Orders</h1>
        <div className="text-xs text-[rgba(17,24,39,0.55)]">Page {page + 1}</div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        <FilterChip label="All" active={statusFilter === "all"} onClick={() => { setStatusFilter("all"); setPage(0); }} />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={s.replace("_", " ")}
            active={statusFilter === s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
          />
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="text-2xl mb-2 animate-pulse">📋</div>
            <div className="text-sm text-[rgba(17,24,39,0.55)]">Loading...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-2xl mb-2">📭</div>
            <div className="text-sm text-[rgba(17,24,39,0.55)]">No orders found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.07)] bg-[#f7f8fa]">
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Order</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Status</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Total</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Customer</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Driver</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#f7f8fa]/50">
                    <td className="px-4 py-3 font-heading font-bold">#{o.order_number}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-heading font-bold border ${STATUS_COLORS[o.status] || ""}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-heading font-bold">R{o.total}</td>
                    <td className="px-4 py-3 text-[rgba(17,24,39,0.55)] font-mono">{o.customer_id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-[rgba(17,24,39,0.55)]">{o.driver_id ? o.driver_id.slice(0, 8) + "..." : "—"}</td>
                    <td className="px-4 py-3 text-[rgba(17,24,39,0.55)]">{new Date(o.created_at).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-4 py-2 rounded-xl bg-white border border-[rgba(0,0,0,0.07)] font-heading font-bold text-xs disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={orders.length < pageSize}
          className="px-4 py-2 rounded-xl bg-white border border-[rgba(0,0,0,0.07)] font-heading font-bold text-xs disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-heading font-bold border transition-colors capitalize ${
        active
          ? "bg-[#1E9E5A] text-white border-[#1E9E5A]"
          : "bg-white text-[rgba(17,24,39,0.55)] border-[rgba(0,0,0,0.11)] hover:border-[#1E9E5A]/30"
      }`}
    >
      {label}
    </button>
  );
}

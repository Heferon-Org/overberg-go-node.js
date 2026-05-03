"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToastStore } from "@/lib/store";
import type { Profile } from "@/lib/supabase/types";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AdminUsersPage() {
  const showToast = useToastStore((s) => s.show);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  async function fetchUsers() {
    setLoading(true);
    const client = getClient();
    let query = client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data } = await query;
    setUsers((data || []) as Profile[]);
    setLoading(false);
  }

  async function changeRole(userId: string, role: string) {
    const client = getClient();
    await client.from("profiles").update({ role }).eq("id", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: role as Profile["role"] } : u)));
    showToast(`User role → ${role}`);
  }

  async function refundLastOrder(userId: string) {
    const client = getClient();
    const { data: lastOrder } = await client
      .from("orders")
      .select("id, total, order_number")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!lastOrder) { showToast("No orders found"); return; }
    const order = lastOrder as { id: string; total: number; order_number: string };

    const { data: profile } = await client.from("profiles").select("wallet_balance").eq("id", userId).single();
    const currentBalance = (profile as { wallet_balance: number } | null)?.wallet_balance || 0;

    await client.from("profiles").update({ wallet_balance: currentBalance + order.total }).eq("id", userId);
    await client.from("wallet_transactions").insert({
      user_id: userId,
      type: "refund",
      amount: order.total,
      balance_after: currentBalance + order.total,
      description: `Refund for order #${order.order_number}`,
      order_id: order.id,
    });

    showToast(`✓ Refunded R${order.total} for #${order.order_number}`);
  }

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700 border-purple-200",
    customer: "bg-[#1E9E5A]/10 text-[#1E9E5A] border-[#1E9E5A]/25",
    driver: "bg-[#0E9EC2]/10 text-[#0E9EC2] border-[#0E9EC2]/25",
    vendor: "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/25",
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-black text-xl text-[#111827]">User Management</h1>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by name or phone..."
          className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-white border border-[rgba(0,0,0,0.07)] text-sm"
        />
      </div>

      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="text-2xl animate-pulse mb-2">👤</div>
            <div className="text-sm text-[rgba(17,24,39,0.55)]">Loading...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.07)] bg-[#f7f8fa]">
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">User</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Role</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Area</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Wallet</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Joined</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[rgba(0,0,0,0.04)]">
                    <td className="px-4 py-3">
                      <div className="font-heading font-bold">{u.full_name || "—"}</div>
                      <div className="text-[rgba(17,24,39,0.45)] mt-0.5">{u.phone || u.id.slice(0, 12)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold border ${ROLE_COLORS[u.role] || ""}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.area}</td>
                    <td className="px-4 py-3 font-heading font-bold">R{u.wallet_balance}</td>
                    <td className="px-4 py-3 text-[rgba(17,24,39,0.55)]">
                      {new Date(u.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-[10px] font-heading font-bold"
                        >
                          <option value="customer">Customer</option>
                          <option value="driver">Driver</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => refundLastOrder(u.id)} className="px-2 py-1 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/25 text-[10px] font-heading font-bold text-[#F5A623]">
                          Refund last
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3 mt-4">
        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-4 py-2 rounded-xl bg-white border border-[rgba(0,0,0,0.07)] font-heading font-bold text-xs disabled:opacity-40">
          ← Previous
        </button>
        <button onClick={() => setPage(page + 1)} disabled={users.length < pageSize} className="px-4 py-2 rounded-xl bg-white border border-[rgba(0,0,0,0.07)] font-heading font-bold text-xs disabled:opacity-40">
          Next →
        </button>
      </div>
    </div>
  );
}

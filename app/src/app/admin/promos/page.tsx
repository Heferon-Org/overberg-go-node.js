"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToastStore } from "@/lib/store";
import type { PromoCode } from "@/lib/supabase/types";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AdminPromosPage() {
  const showToast = useToastStore((s) => s.show);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percent" as "percent" | "fixed" | "free_delivery",
    discount_value: 10,
    min_order_amount: 0,
    applies_to: "all" as string,
    usage_limit: 100,
    per_user_limit: 1,
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    const client = getClient();
    const { data } = await client.from("promo_codes").select("*").order("created_at", { ascending: false });
    setPromos((data || []) as PromoCode[]);
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    const client = getClient();
    await client.from("promo_codes").update({ active: !current }).eq("id", id);
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, active: !current } : p)));
    showToast(`Promo ${!current ? "activated" : "disabled"}`);
  }

  async function createPromo() {
    if (!form.code) { showToast("Code is required"); return; }
    const client = getClient();
    const { error } = await client.from("promo_codes").insert({
      code: form.code.toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_amount: form.min_order_amount,
      applies_to: form.applies_to,
      usage_limit: form.usage_limit,
      per_user_limit: form.per_user_limit,
      starts_at: new Date().toISOString(),
      active: true,
    });
    if (error) { showToast(error.message); return; }
    showToast("✓ Promo created");
    setShowForm(false);
    setForm({ code: "", description: "", discount_type: "percent", discount_value: 10, min_order_amount: 0, applies_to: "all", usage_limit: 100, per_user_limit: 1 });
    fetchPromos();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-2xl animate-pulse">🎟️</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-black text-xl text-[#111827]">Promo Codes</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-[#1E9E5A] text-white text-xs font-heading font-bold">
          {showForm ? "Cancel" : "+ New Promo"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-5 mb-5">
          <h3 className="font-heading font-bold text-sm mb-4">Create Promo Code</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-bold mb-1">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-sm font-heading font-bold uppercase" placeholder="e.g. OVERBERG20" />
            </div>
            <div>
              <label className="block text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-bold mb-1">Discount type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as typeof form.discount_type })} className="w-full px-3 py-2 rounded-xl bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-sm">
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed (Rand)</option>
                <option value="free_delivery">Free delivery</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-bold mb-1">Discount value</label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-bold mb-1">Min order (R)</label>
              <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-sm" />
            </div>
            <div>
              <label className="block text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-bold mb-1">Applies to</label>
              <select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-sm">
                <option value="all">All</option>
                <option value="food">Food</option>
                <option value="ride">Ride</option>
                <option value="shop">Shop</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-bold mb-1">Usage limit</label>
              <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-sm" />
            </div>
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#f7f8fa] border border-[rgba(0,0,0,0.07)] text-sm mb-4" placeholder="Description (optional)" />
          <button onClick={createPromo} className="px-6 py-2.5 rounded-xl bg-[#1E9E5A] text-white text-sm font-heading font-bold">
            Create
          </button>
        </div>
      )}

      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl overflow-hidden">
        {promos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-2xl mb-2">🎟️</div>
            <div className="text-sm text-[rgba(17,24,39,0.55)]">No promo codes yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.07)] bg-[#f7f8fa]">
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Code</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Discount</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Applies</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Used</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Status</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-[rgba(17,24,39,0.55)]">Action</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-b border-[rgba(0,0,0,0.04)]">
                    <td className="px-4 py-3 font-heading font-black tracking-wider">{p.code}</td>
                    <td className="px-4 py-3">
                      {p.discount_type === "percent" ? `${p.discount_value}%` : p.discount_type === "fixed" ? `R${p.discount_value}` : "Free delivery"}
                    </td>
                    <td className="px-4 py-3 capitalize">{p.applies_to}</td>
                    <td className="px-4 py-3">{p.usage_count}/{p.usage_limit || "∞"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold border ${
                        p.active ? "bg-[#1E9E5A]/10 text-[#1E9E5A] border-[#1E9E5A]/25" : "bg-[rgba(17,24,39,0.05)] text-[rgba(17,24,39,0.35)] border-[rgba(0,0,0,0.07)]"
                      }`}>
                        {p.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(p.id, p.active)} className={`px-2.5 py-1 rounded-lg text-[10px] font-heading font-bold border ${
                        p.active ? "bg-[#E8503A]/10 border-[#E8503A]/25 text-[#E8503A]" : "bg-[#1E9E5A]/10 border-[#1E9E5A]/25 text-[#1E9E5A]"
                      }`}>
                        {p.active ? "Disable" : "Enable"}
                      </button>
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

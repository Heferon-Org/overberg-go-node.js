"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useToastStore } from "@/lib/store";
import type { SupportTicket } from "@/lib/supabase/types";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-[#E8503A]/10 text-[#E8503A] border-[#E8503A]/25",
  high: "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/25",
  normal: "bg-[#0E9EC2]/10 text-[#0E9EC2] border-[#0E9EC2]/25",
  low: "bg-[rgba(17,24,39,0.05)] text-[rgba(17,24,39,0.55)] border-[rgba(0,0,0,0.07)]",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/25",
  in_progress: "bg-[#0E9EC2]/10 text-[#0E9EC2] border-[#0E9EC2]/25",
  waiting_user: "bg-[rgba(17,24,39,0.05)] text-[rgba(17,24,39,0.55)] border-[rgba(0,0,0,0.07)]",
  resolved: "bg-[#1E9E5A]/10 text-[#1E9E5A] border-[#1E9E5A]/25",
  closed: "bg-[rgba(17,24,39,0.05)] text-[rgba(17,24,39,0.35)] border-[rgba(0,0,0,0.07)]",
};

export default function AdminTicketsPage() {
  const showToast = useToastStore((s) => s.show);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "all">("open");

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  async function fetchTickets() {
    setLoading(true);
    const client = getClient();
    let query = client.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(50);
    if (filter === "open") {
      query = query.in("status", ["open", "in_progress"]);
    }
    const { data } = await query;
    setTickets((data || []) as SupportTicket[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const client = getClient();
    const update: Record<string, unknown> = { status };
    if (status === "resolved") update.resolved_at = new Date().toISOString();
    await client.from("support_tickets").update(update).eq("id", id);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: status as SupportTicket["status"] } : t)));
    showToast(`Ticket → ${status.replace("_", " ")}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-2xl animate-pulse">🎫</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-black text-xl text-[#111827]">Support Tickets</h1>
        <div className="flex gap-2">
          <button onClick={() => setFilter("open")} className={`px-3 py-1.5 rounded-xl text-[11px] font-heading font-bold border ${filter === "open" ? "bg-[#1E9E5A] text-white border-[#1E9E5A]" : "bg-white border-[rgba(0,0,0,0.07)]"}`}>
            Open ({tickets.filter((t) => t.status === "open" || t.status === "in_progress").length})
          </button>
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-xl text-[11px] font-heading font-bold border ${filter === "all" ? "bg-[#1E9E5A] text-white border-[#1E9E5A]" : "bg-white border-[rgba(0,0,0,0.07)]"}`}>
            All
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-12 text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-sm text-[rgba(17,24,39,0.55)]">No open tickets</div>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-heading font-bold text-sm">{t.subject}</div>
                  <div className="text-[11px] text-[rgba(17,24,39,0.55)] mt-0.5">
                    #{t.ticket_number} · {t.category.replace("_", " ")} · {new Date(t.created_at).toLocaleDateString("en-ZA")}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold border ${PRIORITY_COLORS[t.priority]}`}>
                    {t.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold border ${STATUS_COLORS[t.status]}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              {t.description && (
                <p className="text-xs text-[rgba(17,24,39,0.55)] mb-3 line-clamp-2">{t.description}</p>
              )}
              <div className="flex gap-2">
                {t.status === "open" && (
                  <button onClick={() => updateStatus(t.id, "in_progress")} className="px-3 py-1.5 rounded-lg bg-[#0E9EC2]/10 border border-[#0E9EC2]/25 text-[#0E9EC2] text-[10px] font-heading font-bold">
                    Start working
                  </button>
                )}
                {(t.status === "open" || t.status === "in_progress") && (
                  <button onClick={() => updateStatus(t.id, "resolved")} className="px-3 py-1.5 rounded-lg bg-[#1E9E5A]/10 border border-[#1E9E5A]/25 text-[#1E9E5A] text-[10px] font-heading font-bold">
                    Resolve
                  </button>
                )}
                {t.status === "resolved" && (
                  <button onClick={() => updateStatus(t.id, "closed")} className="px-3 py-1.5 rounded-lg bg-[rgba(17,24,39,0.05)] border border-[rgba(0,0,0,0.07)] text-[rgba(17,24,39,0.55)] text-[10px] font-heading font-bold">
                    Close
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

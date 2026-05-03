"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface DispatchOffer {
  id: string;
  order_id: string;
  driver_id: string;
  attempt_number: number;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
}

/**
 * Subscribe to dispatch offers for the current driver.
 * Returns the most recent unexpired (within 30s) offered log entry, or null.
 */
export function useDriverDispatchOffer(driverId: string | undefined) {
  const [offer, setOffer] = useState<DispatchOffer | null>(null);

  useEffect(() => {
    if (!driverId) return;
    const client = getClient();

    const fetchLatest = async () => {
      const cutoff = new Date(Date.now() - 30_000).toISOString();
      const { data } = await client
        .from("dispatch_logs")
        .select("*")
        .eq("driver_id", driverId)
        .eq("action", "offered")
        .gt("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setOffer((data as DispatchOffer | null) || null);
    };

    fetchLatest();

    const channel = client
      .channel(`dispatch-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dispatch_logs",
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const row = payload.new as DispatchOffer & { action: string };
          if (row.action === "offered") setOffer(row);
        }
      )
      .subscribe();

    // Auto-expire offers after 30s
    const expireTimer = setInterval(() => {
      setOffer((curr) => {
        if (!curr) return null;
        const age = Date.now() - new Date(curr.created_at).getTime();
        return age > 30_000 ? null : curr;
      });
    }, 1000);

    return () => {
      client.removeChannel(channel);
      clearInterval(expireTimer);
    };
  }, [driverId]);

  return offer;
}

/**
 * Submit an accept/reject response to a dispatch offer.
 */
export async function respondToDispatch(
  orderId: string,
  response: "accept" | "reject"
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/driver/dispatch/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId, response }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: json.error || `http ${res.status}` };
  return { ok: true };
}

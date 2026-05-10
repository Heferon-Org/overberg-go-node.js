"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type ServiceBid = {
  id: string;
  request_id: string;
  provider_id: string;
  amount_cents: number;
  message: string | null;
  eta_hours: number | null;
  status: string;
  created_at: string;
  provider_name?: string;
  provider_rating?: number;
};

export function useRealtimeBids(requestId: string) {
  const [bids, setBids] = useState<ServiceBid[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadBids = useCallback(async () => {
    const { data } = await supabase
      .from("service_bids")
      .select("*")
      .eq("request_id", requestId)
      .eq("status", "pending")
      .order("amount_cents", { ascending: true });
    if (data) setBids(data as ServiceBid[]);
    setLoading(false);
  }, [supabase, requestId]);

  useEffect(() => {
    loadBids();

    const channel = supabase
      .channel(`bids-${requestId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_bids", filter: `request_id=eq.${requestId}` },
        () => { loadBids(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, requestId, loadBids]);

  return { bids, loading, refresh: loadBids };
}

export type ServiceRequest = {
  id: string;
  customer_id: string;
  category: string;
  title: string;
  description: string | null;
  photos: string[];
  address: string | null;
  budget_min_cents: number;
  budget_max_cents: number;
  scheduled_for: string | null;
  status: string;
  bidding_closes_at: string | null;
  created_at: string;
  bid_count?: number;
};

export function useRealtimeRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadRequests = useCallback(async () => {
    const { data } = await supabase
      .from("service_requests")
      .select("*")
      .in("status", ["open", "bidding"])
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setRequests(data as ServiceRequest[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel("service-requests-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests" },
        () => { loadRequests(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, loadRequests]);

  return { requests, loading, refresh: loadRequests };
}

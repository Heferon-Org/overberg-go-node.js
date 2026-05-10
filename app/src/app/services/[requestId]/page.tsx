"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeBids, type ServiceBid } from "@/lib/supabase/bidding-hooks";

type RequestDetail = {
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
};

const CATEGORY_EMOJI: Record<string, string> = {
  plumber: "🔧", electrician: "⚡", painter: "🎨", gardener: "🌱",
  cleaner: "🧹", handyman: "🔨", locksmith: "🔑", pest_control: "🐛",
  moving: "🚚", appliance_repair: "🔌", other: "📋",
};

export default function ServiceRequestPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const { bids, loading: bidsLoading } = useRealtimeBids(requestId);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", requestId)
        .single();
      if (data) {
        setRequest(data as RequestDetail);
        setIsOwner(user?.id === (data as RequestDetail).customer_id);
      }
    })();
  }, [requestId, supabase]);

  async function acceptBid(bid: ServiceBid) {
    setAccepting(bid.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("accept_service_bid", {
      p_request_id: requestId,
      p_bid_id: bid.id,
    });
    if (!error && data) {
      const result = data as { ok: boolean; order_id: string };
      if (result.ok) {
        router.push(`/orders/${result.order_id}`);
        return;
      }
    }
    setAccepting(null);
  }

  if (!request) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <button onClick={() => router.back()} className="text-sm text-primary mb-4">&larr; Back</button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">
          {CATEGORY_EMOJI[request.category] || "📋"}
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">{request.title}</h1>
          <p className="text-xs text-t3 capitalize">{request.category.replace(/_/g, " ")}</p>
        </div>
      </div>

      <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium mb-4 ${
        request.status === "completed" ? "bg-green-100 text-green-700" :
        request.status === "cancelled" ? "bg-red-100 text-red-700" :
        request.status === "accepted" ? "bg-blue-100 text-blue-700" :
        "bg-amber-100 text-amber-700"
      }`}>
        {request.status}
      </span>

      {request.description && (
        <p className="text-sm text-t2 mb-4">{request.description}</p>
      )}

      <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-t3">Location</span>
          <span>{request.address}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-t3">Budget</span>
          <span className="font-semibold">
            R{(request.budget_min_cents / 100).toFixed(0)} – R{(request.budget_max_cents / 100).toFixed(0)}
          </span>
        </div>
        {request.scheduled_for && (
          <div className="flex justify-between">
            <span className="text-t3">Preferred date</span>
            <span>{new Date(request.scheduled_for).toLocaleDateString("en-ZA", { dateStyle: "medium" })}</span>
          </div>
        )}
        {request.bidding_closes_at && (
          <div className="flex justify-between">
            <span className="text-t3">Bidding closes</span>
            <span>{new Date(request.bidding_closes_at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}</span>
          </div>
        )}
      </div>

      {request.photos.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {request.photos.map((url, i) => (
            <img key={i} src={url} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
          ))}
        </div>
      )}

      <h2 className="font-semibold text-sm mb-3">
        Bids {!bidsLoading && `(${bids.length})`}
      </h2>

      {bidsLoading ? (
        <div className="text-center py-8 text-t3 text-sm">Loading bids...</div>
      ) : bids.length === 0 ? (
        <div className="text-center py-8 text-t3">
          <p className="text-3xl mb-2">🤝</p>
          <p className="text-sm">No bids yet — providers will respond soon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => (
            <div key={bid.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">Provider</p>
                  {bid.eta_hours && (
                    <p className="text-xs text-t3">Can start within {bid.eta_hours}h</p>
                  )}
                </div>
                <p className="text-lg font-bold text-primary">R{(bid.amount_cents / 100).toFixed(0)}</p>
              </div>
              {bid.message && (
                <p className="text-sm text-t2 mb-3">{bid.message}</p>
              )}
              {isOwner && request.status === "open" && (
                <button
                  onClick={() => acceptBid(bid)}
                  disabled={accepting === bid.id}
                  className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {accepting === bid.id ? "Accepting..." : "Accept Bid"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

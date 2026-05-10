"use client";

import { useState } from "react";
import { useRealtimeRequests, type ServiceRequest } from "@/lib/supabase/bidding-hooks";
import { createClient } from "@/lib/supabase/client";

const CATEGORY_EMOJI: Record<string, string> = {
  plumber: "🔧", electrician: "⚡", painter: "🎨", gardener: "🌱",
  cleaner: "🧹", handyman: "🔨", locksmith: "🔑", pest_control: "🐛",
  moving: "🚚", appliance_repair: "🔌", other: "📋",
};

export default function ProviderRequestsPage() {
  const { requests, loading } = useRealtimeRequests();
  const supabase = createClient();
  const [bidding, setBidding] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidEta, setBidEta] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitBid(request: ServiceRequest) {
    if (!bidAmount) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const amountCents = Math.min(parseInt(bidAmount) * 100, request.budget_max_cents);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("service_bids") as any).insert({
      request_id: request.id,
      provider_id: user.id,
      amount_cents: amountCents,
      message: bidMessage || null,
      eta_hours: bidEta ? parseInt(bidEta) : null,
    });

    if (!error) {
      setBidding(null);
      setBidAmount("");
      setBidMessage("");
      setBidEta("");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-24">
        <h1 className="text-xl font-display font-bold mb-4">Available Requests</h1>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-display font-bold mb-1">Available Requests</h1>
      <p className="text-sm text-t3 mb-4">Bid on tasks near you</p>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-t3">
          <p className="text-4xl mb-2">🔍</p>
          <p className="font-medium">No open requests right now</p>
          <p className="text-sm mt-1">New tasks appear in real time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                  {CATEGORY_EMOJI[req.category] || "📋"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{req.title}</h3>
                  <p className="text-xs text-t3 capitalize">{req.category.replace(/_/g, " ")} — {req.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">R{(req.budget_max_cents / 100).toFixed(0)}</p>
                  <p className="text-xs text-t3">max</p>
                </div>
              </div>

              {req.description && (
                <p className="text-xs text-t2 mb-2 line-clamp-2">{req.description}</p>
              )}

              {req.photos.length > 0 && (
                <div className="flex gap-1 mb-2">
                  {req.photos.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              {bidding === req.id ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Your bid (max R${(req.budget_max_cents / 100).toFixed(0)})`}
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 text-sm"
                  />
                  <input
                    type="text"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Message to customer (optional)"
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 text-sm"
                  />
                  <input
                    type="number"
                    value={bidEta}
                    onChange={(e) => setBidEta(e.target.value)}
                    placeholder="Can start within (hours)"
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBidding(null)}
                      className="flex-1 py-2 bg-gray-100 rounded-xl text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitBid(req)}
                      disabled={submitting || !bidAmount}
                      className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {submitting ? "..." : "Submit Bid"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setBidding(req.id)}
                  className="w-full mt-2 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
                >
                  Place Bid
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

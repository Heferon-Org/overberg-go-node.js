"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useToastStore } from "@/lib/store";
import { useOptionalAuth } from "@/lib/supabase/auth";
import { useDriverGeolocation } from "@/lib/supabase/hooks";
import { useDriverDispatchOffer, respondToDispatch } from "@/lib/supabase/dispatch-hooks";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const weekStats = [
  { title: "This week", value: "R2,840", color: "text-primary", sub: "47 trips · 6 days" },
  { title: "Acceptance rate", value: "92%", color: "text-t1", sub: "Top Driver tier" },
  { title: "Completion", value: "99%", color: "text-t1", sub: "0 cancellations" },
  { title: "Next payout", value: "R1,680", color: "text-sun", sub: "Friday EFT" },
];

export default function DriverPage() {
  const [online, setOnline] = useState(true);
  const [hasActiveOrder, setHasActiveOrder] = useState(true);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const showToast = useToastStore((s) => s.show);
  const auth = useOptionalAuth();
  const driverId = auth?.user?.id;

  useDriverGeolocation(driverId, online && hasActiveOrder);
  const liveOffer = useDriverDispatchOffer(driverId);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCurrentPos({ lat: -34.7731, lng: 20.0507 }),
      { timeout: 5000 }
    );
  }, []);

  const mapCenter: [number, number] = currentPos
    ? [currentPos.lng, currentPos.lat]
    : [20.0507, -34.7731];

  return (
    <div>
      {/* Header */}
      <div className="px-[18px] pt-3">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Link href="/profile" className="text-t3 text-sm">←</Link>
              <h1 className="font-heading font-black text-xl tracking-tight">
                Driver <span className="text-primary">Dashboard</span>
              </h1>
            </div>
            <div className="text-[11px] text-t2 ml-6">Johan van der Berg · CA 834-GN</div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-heading font-bold text-xs text-primary">
              {online ? "Online" : "Offline"}
            </span>
            <button
              onClick={() => {
                setOnline(!online);
                showToast(online ? "Going offline..." : "✓ You are now online");
              }}
              className={`w-[44px] h-[24px] rounded-full relative transition-colors ${
                online ? "bg-primary" : "bg-dark3 border border-bd"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                  online ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Active status */}
        {online && (
          <div className="flex items-center gap-2 bg-primary/[0.08] border border-primary/20 rounded-xl p-2.5 px-3.5 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-live" />
            <span className="font-heading font-bold text-[13px]">Active · Struisbaai area</span>
            <span className="text-[11px] text-t2 ml-auto">3 riders nearby</span>
          </div>
        )}
      </div>

      {/* Earnings */}
      <div className="flex gap-3 px-[18px] mb-4">
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-primary">R428</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Today</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl">12</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Trips</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-sun">★ 4.93</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Rating</div>
        </div>
      </div>

      {/* Active trip + Hotspots CTAs */}
      <div className="px-[18px] mb-3 flex gap-3">
        <Link
          href="/driver/active"
          className="flex-1 bg-sea/10 border border-sea/30 rounded-[14px] p-3 text-center font-heading font-bold text-sm text-sea active:bg-sea/15 transition-colors"
        >
          Active Trip →
        </Link>
        <Link
          href="/driver/hotspots"
          className="flex-1 bg-sun/10 border border-sun/30 rounded-[14px] p-3 text-center font-heading font-bold text-sm text-sun active:bg-sun/15 transition-colors"
        >
          🗺️ Hotspots
        </Link>
      </div>

      {/* Live dispatch offer (Phase 5) */}
      {online && liveOffer && (
        <>
          <div className="px-[18px] mb-2">
            <div className="font-heading font-extrabold text-sm text-sun flex items-center gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-sun animate-pulse-live" />
              New trip request · 30s
            </div>
          </div>
          <div className="mx-[18px] bg-dark2 border-2 border-sun/30 rounded-[18px] p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-heading font-bold text-sm">Order Pickup</div>
                <div className="text-[11px] text-t2 mt-0.5">
                  {liveOffer.distance_km
                    ? `${liveOffer.distance_km.toFixed(1)} km away`
                    : "Distance unknown"}
                  {liveOffer.notes ? ` · ${liveOffer.notes}` : ""}
                </div>
              </div>
              <div className="font-heading font-black text-xl text-primary">Offer #{liveOffer.attempt_number}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const r = await respondToDispatch(liveOffer.order_id, "reject");
                  showToast(r.ok ? "Trip declined — finding next driver" : r.error || "Failed");
                }}
                className="flex-1 bg-dark3 border border-bd text-t2 font-heading font-bold text-sm py-3 rounded-2xl active:scale-[0.98] transition-transform"
              >
                Decline
              </button>
              <button
                onClick={async () => {
                  const r = await respondToDispatch(liveOffer.order_id, "accept");
                  if (r.ok) {
                    setHasActiveOrder(true);
                    showToast("✓ Trip accepted! Navigate to pickup →");
                  } else {
                    showToast(r.error || "Failed");
                  }
                }}
                className="flex-[2] bg-primary text-white font-heading font-bold text-sm py-3 rounded-2xl active:bg-primary-dark active:scale-[0.98] transition-all"
              >
                Accept
              </button>
            </div>
          </div>
        </>
      )}

      {/* Demo trip request (when no live offer) */}
      {online && !liveOffer && (
        <>
          <div className="px-[18px] mb-2">
            <div className="font-heading font-extrabold text-sm text-t3 flex items-center gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-t3" />
              Waiting for dispatch
            </div>
          </div>
          <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 mb-4 text-center">
            <div className="text-2xl mb-2">🛵</div>
            <div className="font-heading font-bold text-sm text-t2">No active offers</div>
            <div className="text-[11px] text-t3 mt-1">You&apos;ll be notified when a nearby order is placed</div>
          </div>
        </>
      )}

      {/* Weekly stats */}
      <div className="grid grid-cols-2 gap-3 px-[18px] mb-4">
        {weekStats.map((s) => (
          <div key={s.title} className="bg-dark2 border border-bd rounded-[16px] p-3.5">
            <div className="text-[10px] text-t3 font-heading font-semibold mb-1">{s.title}</div>
            <div className={`font-heading font-black text-lg ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-t2 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Live Mapbox map */}
      <div className="px-[18px] mb-4">
        <div className="font-heading font-bold text-sm mb-2.5">Your area</div>
        <div className="rounded-[16px] overflow-hidden border border-bd">
          <MapView
            className="h-[140px] w-full"
            center={mapCenter}
            zoom={13}
            pins={[
              {
                lng: mapCenter[0],
                lat: mapCenter[1],
                color: "#1E9E5A",
                emoji: "🚗",
                label: "You — Struisbaai",
                pulse: online,
              },
            ]}
            interactive={false}
          />
        </div>
      </div>

      <div className="px-[18px] pb-8">
        <button
          onClick={() => {
            setOnline(false);
            setHasActiveOrder(false);
            showToast("Going offline. See you next time!");
          }}
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-[17px] active:bg-primary-dark active:scale-[0.98] transition-all"
        >
          Go Offline
        </button>
      </div>
    </div>
  );
}

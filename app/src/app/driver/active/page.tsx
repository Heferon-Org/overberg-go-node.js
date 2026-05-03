"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useOptionalAuth } from "@/lib/supabase/auth";
import {
  useDriverActiveOrder,
  useDriverGeolocation,
  transitionOrder,
} from "@/lib/supabase/hooks";
import { useToastStore } from "@/lib/store";
import { getDirections, formatEta, type DirectionsResult } from "@/lib/mapbox/directions";
import { createBrowserClient } from "@supabase/ssr";
import type { OrderStatus } from "@/lib/supabase/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function nextAction(status: OrderStatus): { label: string; next: OrderStatus; hint: string } | null {
  switch (status) {
    case "confirmed":
    case "preparing":
      return { label: "Mark Picked Up", next: "picked_up", hint: "Confirm collection from restaurant" };
    case "ready":
      return { label: "Mark Picked Up", next: "picked_up", hint: "Order is ready — collect now" };
    case "picked_up":
      return { label: "Start Delivery", next: "on_the_way", hint: "Heading to customer" };
    case "on_the_way":
      return { label: "Mark Delivered", next: "delivered", hint: "Confirm delivery to customer" };
    default:
      return null;
  }
}

export default function DriverActivePage() {
  const auth = useOptionalAuth();
  const driverId = auth?.user?.id;
  const showToast = useToastStore((s) => s.show);
  const { order, loading } = useDriverActiveOrder(driverId);
  useDriverGeolocation(driverId, !!order);

  const [pickup, setPickup] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!order) return;
    getClient()
      .from("restaurants")
      .select("name, latitude, longitude")
      .eq("id", order.restaurant_id)
      .single()
      .then(({ data }) => {
        const row = data as { name: string; latitude: number | null; longitude: number | null } | null;
        if (row?.latitude && row?.longitude) {
          setPickup({ lat: row.latitude, lng: row.longitude, name: row.name });
        }
      });
  }, [order?.restaurant_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCurrentPos({ lat: -34.7731, lng: 20.0507 })
    );
  }, []);

  // Compute route based on stage
  useEffect(() => {
    if (!order || !currentPos) return;

    let target: [number, number] | null = null;
    if (order.status === "confirmed" || order.status === "preparing" || order.status === "ready") {
      if (pickup) target = [pickup.lng, pickup.lat];
    } else if (order.status === "picked_up" || order.status === "on_the_way") {
      if (order.delivery_longitude && order.delivery_latitude) {
        target = [order.delivery_longitude, order.delivery_latitude];
      }
    }

    if (!target) {
      setDirections(null);
      return;
    }
    getDirections([currentPos.lng, currentPos.lat], target).then((r) => {
      if (r) setDirections(r);
    });
  }, [order?.status, pickup, currentPos]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (next: OrderStatus, label: string) => {
    if (!order || submitting) return;
    setSubmitting(true);
    const res = await transitionOrder(order.id, next);
    setSubmitting(false);
    if (res.ok) showToast(`✓ ${label}`);
    else showToast(res.error || "Failed");
  };

  if (!auth?.user) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-center px-8">
        <div>
          <div className="text-3xl mb-3">🔒</div>
          <div className="font-heading font-bold text-sm mb-2">Sign in to view active trip</div>
          <Link href="/auth" className="text-primary font-heading font-bold text-xs">Sign in →</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">🛵</div>
          <div className="font-heading font-bold text-sm text-t2">Loading...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-[18px] pt-3">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/driver" className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0">←</Link>
          <h1 className="font-heading font-black text-lg">Active Trip</h1>
        </div>
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <div className="font-heading font-bold text-sm mb-1">No active trip</div>
          <div className="text-xs text-t2 mb-4">Accept a dispatch offer from your dashboard to start</div>
          <Link href="/driver" className="inline-block bg-primary text-white font-heading font-bold text-sm px-5 py-2.5 rounded-2xl">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const action = nextAction(order.status);
  const stage =
    order.status === "confirmed" || order.status === "preparing" || order.status === "ready"
      ? "to-pickup"
      : "to-customer";

  const pins: { lng: number; lat: number; color: string; emoji: string; label: string; pulse?: boolean }[] = [];
  if (currentPos) {
    pins.push({ lng: currentPos.lng, lat: currentPos.lat, color: "#1E9E5A", emoji: "🛵", label: "You", pulse: true });
  }
  if (pickup && stage === "to-pickup") {
    pins.push({ lng: pickup.lng, lat: pickup.lat, color: "#0E9EC2", emoji: "🍽️", label: pickup.name });
  }
  if (order.delivery_latitude && order.delivery_longitude && stage === "to-customer") {
    pins.push({
      lng: order.delivery_longitude,
      lat: order.delivery_latitude,
      color: "#F5A623",
      emoji: "📍",
      label: "Customer",
    });
  }

  const mapCenter: [number, number] = currentPos ? [currentPos.lng, currentPos.lat] : [20.0507, -34.7731];

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link href="/driver" className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0">←</Link>
        <div>
          <h1 className="font-heading font-black text-lg">Active Trip</h1>
          <p className="text-xs text-t2">#{order.order_number}</p>
        </div>
        <div className="ml-auto bg-primary/10 border border-primary/25 rounded-full px-3 py-1">
          <span className="font-heading font-bold text-[11px] text-primary capitalize">{order.status.replace("_", " ")}</span>
        </div>
      </div>

      {/* Live map */}
      <div className="mx-[18px] rounded-[18px] overflow-hidden border border-bd mb-4 relative">
        <MapView
          className="h-[220px] w-full"
          center={mapCenter}
          zoom={14}
          pins={pins}
          route={directions?.geometry || null}
        />
        {directions && (
          <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur rounded-xl px-3.5 py-2">
            <div className="font-heading font-extrabold text-[15px] text-white">{formatEta(directions.duration)}</div>
            <div className="text-[10px] text-white/80">{(directions.distance / 1000).toFixed(1)} km away</div>
          </div>
        )}
      </div>

      {/* Stage hint */}
      <div className="mx-[18px] mb-4 bg-dark2 border border-bd rounded-[18px] p-4">
        <div className="font-heading font-bold text-xs text-t2 mb-1.5">Next destination</div>
        <div className="font-heading font-bold text-sm">
          {stage === "to-pickup" ? `🍽️ ${pickup?.name || "Restaurant"}` : `📍 ${order.delivery_address || "Customer address"}`}
        </div>
        {stage === "to-customer" && order.delivery_code && (
          <div className="mt-3 pt-3 border-t border-bd flex items-center justify-between">
            <span className="text-xs text-t2 font-heading font-bold">Delivery code</span>
            <span className="font-heading font-black text-2xl text-primary tracking-[0.2em]">{order.delivery_code}</span>
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 mb-4">
        <h3 className="font-heading font-bold text-sm mb-3">Order Items</h3>
        <div className="space-y-2 text-xs">
          {(order.items || []).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center justify-between">
              <span>
                <span className="font-heading font-bold mr-2">{item.quantity}x</span>
                <span className="text-t2">{item.name}</span>
              </span>
              <span className="text-t2">R{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t border-bd pt-2.5 mt-2.5 flex justify-between font-heading font-bold text-sm">
            <span>Delivery fee</span>
            <span className="text-primary">R{order.delivery_fee}</span>
          </div>
        </div>
      </div>

      {/* Action button */}
      {action && (
        <div className="px-[18px]">
          <div className="text-center text-xs text-t2 mb-3">{action.hint}</div>
          <button
            onClick={() => handleAction(action.next, action.label)}
            disabled={submitting}
            className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-[17px] active:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {submitting ? "Updating..." : action.label}
          </button>
        </div>
      )}

      {!action && order.status === "delivered" && (
        <div className="px-[18px] text-center">
          <div className="text-4xl mb-3">🎉</div>
          <div className="font-heading font-black text-lg mb-1">Trip complete!</div>
          <div className="text-xs text-t2 mb-5">Earnings will appear in your weekly payout.</div>
          <Link href="/driver" className="inline-block bg-primary text-white font-heading font-bold text-sm px-5 py-2.5 rounded-2xl">
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

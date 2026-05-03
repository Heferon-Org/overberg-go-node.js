"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useOrder, useDriverPosition } from "@/lib/supabase/hooks";
import { useOptionalAuth } from "@/lib/supabase/auth";
import { getDirections, formatEta, type DirectionsResult } from "@/lib/mapbox/directions";
import { RatingModal } from "@/components/RatingModal";
import type { OrderStatus } from "@/lib/supabase/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const STEP_CONFIG: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "placed", label: "Placed", icon: "📋" },
  { key: "confirmed", label: "Confirmed", icon: "✓" },
  { key: "preparing", label: "Preparing", icon: "🍳" },
  { key: "ready", label: "Ready", icon: "✅" },
  { key: "picked_up", label: "Picked up", icon: "📦" },
  { key: "on_the_way", label: "On the way", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
];

// Demo restaurant coordinates in the Overberg
const DEMO_RESTAURANT: [number, number] = [20.0507, -34.7731]; // Struisbaai harbour area
const DEMO_CUSTOMER: [number, number] = [20.0556, -34.7683]; // Marine 127 area

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const auth = useOptionalAuth();
  const { order, loading } = useOrder(orderId);
  const driverPosition = useDriverPosition(order?.driver_id ?? undefined);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [showRating, setShowRating] = useState(false);

  const currentStatus = order?.status || "placed";
  const currentStepIndex = STEP_CONFIG.findIndex((s) => s.key === currentStatus);
  const isDelivered = currentStatus === "delivered";

  // Fetch route when driver is on the way
  useEffect(() => {
    if (!driverPosition) return;
    if (currentStatus !== "on_the_way" && currentStatus !== "picked_up") return;

    const destination = DEMO_CUSTOMER;
    getDirections([driverPosition.lng, driverPosition.lat], destination).then((result) => {
      if (result) setDirections(result);
    });
  }, [driverPosition, currentStatus]);

  // Show rating after delivery
  useEffect(() => {
    if (isDelivered) {
      const timer = setTimeout(() => setShowRating(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isDelivered]);

  const restaurantCoords = DEMO_RESTAURANT;
  const customerCoords = DEMO_CUSTOMER;

  const pins = [
    { lng: restaurantCoords[0], lat: restaurantCoords[1], color: "#0E9EC2", emoji: "🍽️", label: order?.restaurant_id ? "Restaurant" : "Harbour Café" },
    { lng: customerCoords[0], lat: customerCoords[1], color: "#1E9E5A", emoji: "📍", label: "Delivery address" },
  ];

  if (driverPosition && !isDelivered) {
    pins.push({
      lng: driverPosition.lng,
      lat: driverPosition.lat,
      color: "#F5A623",
      emoji: "🛵",
      label: "Driver",
      pulse: true,
    } as typeof pins[number]);
  }

  const etaText = directions ? formatEta(directions.duration) : order?.estimated_delivery || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">🛵</div>
          <div className="font-heading font-bold text-sm text-t2">Loading order...</div>
        </div>
      </div>
    );
  }

  // If no real order found, show demo tracking
  const orderNumber = order?.order_number || "#OBG-2847";
  const orderItems = order?.items || [
    { id: "1", name: "Calamari Rings", price: 89, quantity: 2, emoji: "🦑" },
    { id: "2", name: "Harbour Mezze", price: 145, quantity: 1, emoji: "🍽️" },
    { id: "3", name: "Coke 330ml", price: 25, quantity: 2, emoji: "🥤" },
  ];
  const orderTotal = order?.total || 408;

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/orders"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <div className="flex-1">
          <h1 className="font-heading font-black text-lg">Track Order</h1>
          <p className="text-xs text-t2">{orderNumber} · Harbour Café</p>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">📞</div>
          <Link href="/chat" className="w-10 h-10 rounded-xl bg-sea/10 border border-sea/25 flex items-center justify-center">💬</Link>
        </div>
      </div>

      {/* Live map */}
      <div className="mx-[18px] rounded-[18px] overflow-hidden border border-bd mb-4 relative">
        <MapView
          className="h-[220px] w-full"
          center={driverPosition ? [driverPosition.lng, driverPosition.lat] : [20.053, -34.77]}
          zoom={14}
          pins={pins}
          route={directions?.geometry || null}
        />
        <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur rounded-xl px-3.5 py-2">
          <div className="font-heading font-extrabold text-[15px] text-white">
            {isDelivered ? "Delivered!" : etaText || "Calculating..."}
          </div>
          <div className="text-[10px] text-white/80">
            {isDelivered ? "Enjoy your meal" : "Estimated arrival"}
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          {isDelivered ? (
            <span className="text-2xl">🎉</span>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-live" />
          )}
          <span className="font-heading font-black text-base">
            {isDelivered
              ? "Order Delivered!"
              : STEP_CONFIG[currentStepIndex]?.label === "Preparing"
              ? "Your order is being prepared"
              : STEP_CONFIG[currentStepIndex]?.label === "On the way"
              ? "Your rider is on the way"
              : STEP_CONFIG[currentStepIndex]?.label || "Order placed"}
          </span>
        </div>

        <div className="space-y-0">
          {STEP_CONFIG.map((step, i) => (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < currentStepIndex
                      ? "bg-primary text-white"
                      : i === currentStepIndex
                      ? "bg-primary/20 border-2 border-primary text-primary"
                      : "bg-dark3 border border-bd text-t3"
                  }`}
                >
                  {i < currentStepIndex ? "✓" : step.icon}
                </div>
                {i < STEP_CONFIG.length - 1 && (
                  <div
                    className={`w-0.5 h-6 transition-colors ${
                      i < currentStepIndex ? "bg-primary" : "bg-dark3"
                    }`}
                  />
                )}
              </div>
              <div className="pt-1.5">
                <div className={`font-heading font-bold text-sm ${i <= currentStepIndex ? "text-t1" : "text-t3"}`}>
                  {step.label}
                </div>
                {i === currentStepIndex && !isDelivered && (
                  <div className="text-[10px] text-primary mt-0.5 font-heading font-semibold">In progress...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver card */}
      {(currentStatus === "picked_up" || currentStatus === "on_the_way") && (
        <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-dark3 flex items-center justify-center text-2xl">👤</div>
          <div className="flex-1">
            <div className="font-heading font-bold text-sm">Sipho Ndlovu</div>
            <div className="text-xs text-t2">★ 4.93 · Toyota Corolla</div>
            <div className="text-[10px] text-t3 mt-0.5">CA 234 567</div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">📞</div>
            <Link href="/chat" className="w-10 h-10 rounded-xl bg-sea/10 border border-sea/25 flex items-center justify-center">💬</Link>
          </div>
        </div>
      )}

      {/* ETA + Distance */}
      {directions && !isDelivered && (
        <div className="mx-[18px] flex gap-3 mb-4">
          <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
            <div className="font-heading font-black text-lg text-primary">{formatEta(directions.duration)}</div>
            <div className="text-[10px] text-t2 font-heading font-semibold">ETA</div>
          </div>
          <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
            <div className="font-heading font-black text-lg">{(directions.distance / 1000).toFixed(1)} km</div>
            <div className="text-[10px] text-t2 font-heading font-semibold">Distance</div>
          </div>
        </div>
      )}

      {/* Order summary */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4">
        <h3 className="font-heading font-bold text-sm mb-3">Order Summary</h3>
        <div className="space-y-2 text-xs">
          {orderItems.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-t2">{item.quantity}x {item.name}</span>
              <span>R{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t border-bd pt-2 mt-2 flex justify-between font-heading font-bold text-sm">
            <span>Total</span>
            <span className="text-primary">R{orderTotal}</span>
          </div>
        </div>
      </div>

      <RatingModal
        open={showRating}
        onClose={() => setShowRating(false)}
        restaurantName="Harbour Café"
        driverName="Sipho"
      />
    </div>
  );
}

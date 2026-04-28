"use client";

import Link from "next/link";
import { useCartStore, useToastStore } from "@/lib/store";

const activeOrder = {
  restaurant: "Harbour Café",
  items: "Calamari Rings · Prawn Cocktail · 1x Coke",
  total: "R199",
  eta: "12 min",
  steps: [
    { label: "Placed", icon: "✓", done: true },
    { label: "Confirmed", icon: "✓", done: true },
    { label: "Preparing", icon: "🍳", active: true },
    { label: "On way", icon: "🛵" },
    { label: "Delivered", icon: "🏠" },
  ],
};

const pastOrders = [
  {
    restaurant: "Fish & More",
    restaurantId: "fish-and-more",
    items: "Yellowtail fillet · Chips · Tartare sauce",
    reorderItems: [{ id: "fm-1", name: "Yellowtail Fillet", price: 130, emoji: "🐟" }],
    total: "R145",
    time: "Yesterday, 19:34",
    status: "Delivered",
    rated: true,
  },
  {
    restaurant: "Pick n Pay",
    restaurantId: "",
    items: "Braai pack · Rolls · 2x Castle Lager",
    reorderItems: [],
    total: "R312",
    time: "Sun, 14:22",
    status: "Delivered",
    rated: false,
  },
  {
    restaurant: "GoRide",
    restaurantId: "",
    items: "Struisbaai Harbour → L'Agulhas town",
    reorderItems: [],
    total: "R68",
    time: "Sat, 11:05",
    status: "Completed",
    rated: true,
  },
  {
    restaurant: "Sea Experience",
    restaurantId: "",
    items: "Whale watching boat · 2 pax · Southern Tip Adventures",
    reorderItems: [],
    total: "R760",
    time: "Fri, 07:30",
    status: "Completed",
    rated: false,
  },
];

export default function OrdersPage() {
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);

  const handleReorder = (order: (typeof pastOrders)[0]) => {
    if (order.reorderItems.length === 0) {
      showToast("Quick reorder not available for this order");
      return;
    }
    order.reorderItems.forEach((item) => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        emoji: item.emoji,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurant,
      });
    });
    showToast("✓ Items added to cart");
  };

  return (
    <div className="px-[18px]">
      <h1 className="font-heading font-black text-[22px] tracking-tight pt-3 mb-4">
        Your <span className="text-primary">Orders</span>
      </h1>

      {/* Active order */}
      <div className="bg-dark2 border border-primary/30 rounded-[18px] p-4 mb-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-[7px] h-[7px] bg-primary rounded-full animate-pulse-live" />
          <span className="font-heading font-bold text-xs text-primary">On the way</span>
        </div>
        <div className="font-heading font-bold text-sm mb-1">{activeOrder.restaurant}</div>
        <div className="text-[11px] text-t2 mb-3">{activeOrder.items}</div>

        {/* Tracker */}
        <div className="flex items-center justify-between mb-3">
          {activeOrder.steps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? "bg-primary text-white"
                      : step.active
                      ? "bg-primary/20 border-2 border-primary text-primary"
                      : "bg-dark3 border border-bd text-t3"
                  }`}
                >
                  {step.icon}
                </div>
                <span className={`text-[9px] mt-1 font-heading font-semibold ${step.done || step.active ? "text-t1" : "text-t3"}`}>
                  {step.label}
                </span>
              </div>
              {i < activeOrder.steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 rounded-full ${step.done ? "bg-primary" : "bg-dark3"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="font-heading font-bold text-sm text-t2">
            {activeOrder.total} · ETA {activeOrder.eta}
          </div>
          <div className="flex gap-2">
            <Link href="/chat" className="text-sea text-[11px] font-heading font-bold">Chat 💬</Link>
            <Link href="/orders/tracking" className="font-heading font-bold text-xs text-primary">Track →</Link>
          </div>
        </div>
      </div>

      {/* Past orders */}
      <h2 className="font-heading font-bold text-sm text-t2 mb-2.5 mt-1">Past orders</h2>
      <div className="space-y-3 pb-24">
        {pastOrders.map((order, i) => (
          <div key={i} className="bg-dark2 border border-bd rounded-[18px] p-4">
            <div className="font-heading font-bold text-[11px] text-t3 mb-1">{order.status}</div>
            <div className="font-heading font-bold text-sm mb-0.5">{order.restaurant}</div>
            <div className="text-[11px] text-t2 mb-2">{order.items}</div>
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm">{order.total}</span>
              <div className="flex gap-2">
                {order.reorderItems.length > 0 && (
                  <button
                    onClick={() => handleReorder(order)}
                    className="bg-primary/10 text-primary border border-primary/25 font-heading font-bold text-[11px] px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                  >
                    Reorder
                  </button>
                )}
                {!order.rated && (
                  <button
                    onClick={() => showToast("✓ Thanks for rating!")}
                    className="text-sun font-heading font-bold text-[11px] px-3 py-1.5 bg-sun/10 border border-sun/25 rounded-xl"
                  >
                    Rate ⭐
                  </button>
                )}
                <span className="text-[11px] text-t3 py-1.5">{order.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

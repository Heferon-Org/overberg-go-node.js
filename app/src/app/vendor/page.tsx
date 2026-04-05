"use client";

import { useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/lib/store";

const activeOrders = [
  { id: "#OBG-2844", items: "2x Prawn Cocktail · 1x Bisque", status: "Preparing · 8 min", statusColor: "bg-sea/10 text-sea border-sea/25" },
  { id: "#OBG-2845", items: "1x Mezze · 2x Calamari Tubes", status: "Ready · Awaiting rider", statusColor: "bg-sun/10 text-sun border-sun/25" },
  { id: "#OBG-2846", items: "1x Fish Platter · 3x Drinks", status: "On the way", statusColor: "bg-primary/10 text-primary border-primary/25" },
];

const initialMenuItems = [
  { name: "Calamari Rings", emoji: "🍤", price: "R89", available: true },
  { name: "Prawn Cocktail", emoji: "🥗", price: "R110", available: true },
  { name: "Crayfish Platter", emoji: "🦞", price: "Sold out · 86'd", available: false },
  { name: "Crayfish Bisque", emoji: "🍜", price: "R78", available: true },
  { name: "Harbour Mezze", emoji: "🥩", price: "R145", available: true },
];

export default function VendorPage() {
  const showToast = useToastStore((s) => s.show);
  const [menuItems, setMenuItems] = useState(initialMenuItems);

  const toggleItem = (index: number) => {
    setMenuItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, available: !item.available } : item
      )
    );
    const item = menuItems[index];
    showToast(`${item.name} marked as ${item.available ? "sold out" : "available"}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="px-[18px] pt-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Link href="/profile" className="text-t3 text-sm">←</Link>
              <h1 className="font-heading font-black text-xl tracking-tight">
                Restaurant <span className="text-sea">Dashboard</span>
              </h1>
            </div>
            <div className="text-[11px] text-t2 ml-6">Harbour Café · Struisbaai Harbour</div>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-[10px] px-3 py-1.5">
            <span className="font-heading font-bold text-[11px] text-primary">● Open</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-[18px] mb-4">
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-primary">8</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Active orders</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-sun">R4,280</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Today revenue</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl">★ 4.8</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Rating</div>
        </div>
      </div>

      {/* New order */}
      <div className="px-[18px] mb-2">
        <div className="font-heading font-extrabold text-sm text-sun flex items-center gap-1.5 mb-2.5">
          <div className="w-2 h-2 rounded-full bg-sun animate-pulse-live" />
          New order incoming
        </div>
      </div>
      <div className="mx-[18px] bg-dark2 border-2 border-sun/30 rounded-[18px] p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-heading font-bold text-sm">Order #OBG-2847</div>
            <div className="text-[11px] text-t2 mt-0.5">Delivery · Struisbaai North</div>
          </div>
          <div className="bg-sun/15 text-sun font-heading font-bold text-[11px] px-3 py-1 rounded-full border border-sun/25">
            New · 0:32
          </div>
        </div>

        <div className="space-y-2 border-t border-bd pt-3 mb-3">
          {[
            { qty: 2, name: "Calamari Rings", price: "R178" },
            { qty: 1, name: "Harbour Mezze", price: "R145" },
            { qty: 2, name: "Coke 330ml", price: "R50" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-dark3 rounded-lg flex items-center justify-center font-heading font-bold text-[10px]">
                  {item.qty}
                </span>
                <span>{item.name}</span>
              </div>
              <span className="text-t2">{item.price}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2.5 border-t border-bd">
            <span className="font-heading font-bold text-[13px] text-t2">Total</span>
            <span className="font-heading font-black text-base">R373</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => showToast("Order declined")}
            className="w-12 h-12 bg-dark3 border border-bd rounded-2xl flex items-center justify-center text-coral font-bold text-lg shrink-0 active:scale-95 transition-transform"
          >
            ✕
          </button>
          <button
            onClick={() => showToast("✓ Order accepted! Timer started — 20 min prep")}
            className="flex-1 bg-primary text-white font-heading font-bold text-sm py-3 rounded-2xl active:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Accept · Start 20 min timer
          </button>
        </div>
      </div>

      {/* Active orders */}
      <div className="px-[18px] mb-3.5">
        <h2 className="font-heading font-extrabold text-sm mb-2.5">In progress (3)</h2>
        <div className="bg-dark2 border border-bd rounded-[14px] overflow-hidden">
          {activeOrders.map((order, i) => (
            <div
              key={order.id}
              className={`px-3.5 py-3 flex items-center justify-between ${
                i < activeOrders.length - 1 ? "border-b border-bd" : ""
              }`}
            >
              <div>
                <div className="font-heading font-bold text-[13px]">{order.id}</div>
                <div className="text-[11px] text-t2 mt-0.5">{order.items}</div>
              </div>
              <div className={`${order.statusColor} font-heading font-bold text-[11px] px-2.5 py-1 rounded-full border`}>
                {order.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu toggle */}
      <div className="px-[18px] mb-3.5">
        <h2 className="font-heading font-extrabold text-sm mb-3">Menu availability</h2>
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3 bg-dark2 border border-bd rounded-[14px] p-3.5">
              <div className="w-10 h-10 rounded-xl bg-dark3 flex items-center justify-center text-xl">{item.emoji}</div>
              <div className="flex-1">
                <div className="font-heading font-bold text-sm">{item.name}</div>
                <div className={`text-[11px] mt-0.5 ${item.available ? "text-t2" : "text-coral"}`}>
                  {item.available ? `${item.price} · Available` : item.price}
                </div>
              </div>
              <button
                onClick={() => toggleItem(i)}
                className={`w-[44px] h-[24px] rounded-full relative transition-colors ${
                  item.available ? "bg-primary" : "bg-dark3 border border-bd"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                    item.available ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="px-[18px] pb-8">
        <button
          onClick={() => showToast("✓ Settings saved. All changes live!")}
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-[17px] active:bg-primary-dark active:scale-[0.98] transition-all"
        >
          Save & Publish Menu
        </button>
      </div>
    </div>
  );
}

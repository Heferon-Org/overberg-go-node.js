"use client";

import { use, useState } from "react";
import Link from "next/link";
import { restaurants, menusByRestaurant } from "@/lib/data";
import { useCartStore, useToastStore } from "@/lib/store";

export default function MenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const restaurant = restaurants.find((r) => r.id === id) || restaurants[0];
  const allItems = menusByRestaurant[restaurant.id] || menusByRestaurant["harbour-cafe"] || [];
  const categories = [...new Set(allItems.map((i) => i.category))];
  const [activeCat, setActiveCat] = useState(categories[0] || "Starters");
  const items = allItems.filter((i) => i.category === activeCat);
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.count);
  const cartTotal = useCartStore((s) => s.total);
  const showToast = useToastStore((s) => s.show);

  return (
    <div className="pb-40">
      {/* Hero */}
      <div className="h-[200px] relative overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center text-[80px]"
          style={{ background: restaurant.bg }}
        >
          {restaurant.emoji}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/30 to-transparent" />
        <div className="absolute top-12 left-[18px] z-5">
          <Link
            href="/food"
            className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg"
          >
            ←
          </Link>
        </div>
        <div className="absolute bottom-3.5 left-[18px] right-[18px]">
          <h1 className="font-heading font-black text-[22px] tracking-tight">{restaurant.name}</h1>
          <div className="flex items-center gap-2 text-xs text-t2 mt-1">
            <span>★ {restaurant.rating} ({restaurant.reviews})</span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
            <span>🕐 {restaurant.time}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
            <span>{restaurant.deliveryFee} delivery</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-bd no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-[18px] py-3 font-heading font-bold text-[13px] whitespace-nowrap relative shrink-0 transition-colors ${
              activeCat === cat ? "text-primary" : "text-t3"
            }`}
          >
            {cat}
            {activeCat === cat && (
              <div className="absolute bottom-0 left-[18px] right-[18px] h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              addItem({
                id: item.id,
                name: item.name,
                price: item.price,
                emoji: item.emoji,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
              });
              showToast(`✓ R${item.price} added to cart`);
            }}
            className="w-full flex items-center gap-3 px-[18px] py-3.5 border-b border-bd text-left active:bg-white/[0.03] transition-colors"
          >
            <div className="w-[52px] h-[52px] rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-2xl shrink-0">
              {item.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-sm">{item.name}</div>
              <div className="text-[11px] text-t2 mt-0.5 line-clamp-1">{item.description}</div>
              <div className="font-heading font-bold text-primary text-sm mt-1">R{item.price}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              +
            </div>
          </button>
        ))}
      </div>

      {/* Cart bar */}
      {cartCount() > 0 && (
        <div className="fixed bottom-20 left-4 right-4 bg-primary rounded-2xl p-4 flex items-center justify-between z-40 shadow-lg shadow-primary/20">
          <div>
            <div className="font-heading font-extrabold text-white text-[15px]">View Order</div>
            <div className="text-xs text-white/75">
              {cartCount()} {cartCount() === 1 ? "item" : "items"}
            </div>
          </div>
          <div className="font-heading font-black text-white text-[17px]">R{cartTotal()}</div>
        </div>
      )}
    </div>
  );
}

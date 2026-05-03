"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/lib/store";
import { groceryCategories, fetchGroceryProducts, type GroceryProduct } from "@/lib/data";

export default function GroceriesPage() {
  const showToast = useToastStore((s) => s.show);
  const [groceryProducts, setGroceryProducts] = useState<GroceryProduct[]>([]);

  useEffect(() => {
    fetchGroceryProducts().then(setGroceryProducts);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="pt-2 px-[18px] pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-[14px] bg-[#cc1f1a] flex items-center justify-center font-heading font-black text-sm text-white">
            PnP
          </div>
          <div>
            <div className="font-heading font-extrabold text-lg">Pick n Pay</div>
            <div className="flex gap-1.5 mt-1">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/25 font-heading">
                In-store prices
              </span>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/25 font-heading">
                45 min delivery
              </span>
            </div>
          </div>
        </div>

        {/* Smart Shopper */}
        <div className="bg-dark2 border border-bd rounded-[14px] p-3 flex items-center gap-3">
          <span className="text-lg">⭐</span>
          <div className="flex-1">
            <div className="font-heading font-bold text-xs">Smart Shopper linked · 3,240 pts</div>
            <div className="mt-1.5 h-1.5 bg-dark4 rounded-full overflow-hidden">
              <div className="h-full w-[65%] bg-gradient-to-r from-primary to-sea rounded-full" />
            </div>
          </div>
          <span className="font-heading font-bold text-[11px] text-t2">1,760 to Gold</span>
        </div>
      </div>

      {/* Weekend special banner */}
      <div className="mx-[18px] p-2.5 px-3.5 bg-sun/[0.08] border border-sun/20 rounded-[13px] flex items-center gap-2.5 mb-3">
        <span className="text-xl">🏷️</span>
        <div>
          <div className="font-heading font-bold text-[13px] text-sun">Weekend Specials Active</div>
          <div className="text-[11px] text-t2">Up to 40% off on selected items</div>
        </div>
      </div>

      {/* Browse by aisle */}
      <div className="px-[18px]">
        <h2 className="font-heading font-black text-base mb-3">Browse by aisle</h2>
      </div>
      <div className="grid grid-cols-4 gap-3 px-[18px] mb-4">
        {groceryCategories.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center gap-1.5">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-dark2 border border-bd flex items-center justify-center text-2xl">
              {cat.emoji}
            </div>
            <span className="font-heading font-semibold text-[10px] text-t2">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Weekend deals */}
      <div className="px-[18px] mb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-black text-base">🔥 Weekend deals</h2>
          <span className="font-heading font-semibold text-xs text-primary">See all</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-[18px] pb-24">
        {groceryProducts.map((p) => (
          <button
            key={p.id}
            onClick={() => showToast("✓ Added to PnP basket")}
            className="bg-dark2 border border-bd rounded-[16px] overflow-hidden text-left active:scale-[0.97] transition-transform"
          >
            <div className="h-[90px] bg-dark3 flex items-center justify-center text-[40px] relative">
              {p.emoji}
              {p.discount && (
                <div className="absolute top-2 left-2 bg-coral text-white text-[10px] font-heading font-black px-2 py-0.5 rounded-lg">
                  {p.discount}
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="font-heading font-bold text-xs leading-tight mb-2">{p.name}</div>
              <div className="flex items-center justify-between">
                <div className="font-heading font-black text-primary text-sm">{p.price}</div>
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  +
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

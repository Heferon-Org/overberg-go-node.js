"use client";

import { useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/lib/store";

const activePromos = [
  {
    code: "SEA20",
    title: "20% Off Sea Experiences",
    description: "Valid on all boat trips, fishing charters, and diving",
    discount: "20% off",
    minOrder: "No minimum",
    validUntil: "May 15, 2026",
    emoji: "⚓",
    gradient: "from-sea/10 to-sea/5",
    border: "border-sea/20",
    color: "text-sea",
  },
  {
    code: "PNPSAVE",
    title: "R50 Off Groceries",
    description: "Spend R300+ on Pick n Pay groceries",
    discount: "R50 off",
    minOrder: "Min R300",
    validUntil: "May 1, 2026",
    emoji: "🛒",
    gradient: "from-coral/10 to-coral/5",
    border: "border-coral/20",
    color: "text-coral",
  },
  {
    code: "NEWUSER",
    title: "Welcome — 40% Off",
    description: "40% off your first food order (new users only)",
    discount: "40% off",
    minOrder: "No minimum",
    validUntil: "Jun 30, 2026",
    emoji: "⭐",
    gradient: "from-sun/10 to-sun/5",
    border: "border-sun/20",
    color: "text-sun",
  },
  {
    code: "FREERIDE",
    title: "First Ride Free",
    description: "Free GoRide up to R60 for first-time riders",
    discount: "Up to R60",
    minOrder: "First ride",
    validUntil: "May 31, 2026",
    emoji: "🚗",
    gradient: "from-primary/10 to-primary/5",
    border: "border-primary/20",
    color: "text-primary",
  },
  {
    code: "FRESHFISH",
    title: "R30 Off Fresh Fish",
    description: "Fresh catch delivery from Struisbaai Harbour",
    discount: "R30 off",
    minOrder: "Min R100",
    validUntil: "May 10, 2026",
    emoji: "🐟",
    gradient: "from-sea/10 to-primary/5",
    border: "border-sea/20",
    color: "text-sea",
  },
  {
    code: "STAYCATION",
    title: "15% Off Weekend Stays",
    description: "Book a Fri–Sun stay and save 15%",
    discount: "15% off",
    minOrder: "2-night min",
    validUntil: "Jun 15, 2026",
    emoji: "🏡",
    gradient: "from-primary/10 to-sea/5",
    border: "border-primary/20",
    color: "text-primary",
  },
];

export default function PromosPage() {
  const showToast = useToastStore((s) => s.show);
  const [redeemInput, setRedeemInput] = useState("");

  const handleRedeem = () => {
    if (!redeemInput.trim()) {
      showToast("Enter a promo code");
      return;
    }
    const found = activePromos.find(
      (p) => p.code.toLowerCase() === redeemInput.trim().toLowerCase()
    );
    if (found) {
      showToast(`✓ "${found.code}" applied — ${found.discount}`);
    } else {
      showToast("Invalid promo code");
    }
    setRedeemInput("");
  };

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">
          Promos & <span className="text-sun">Vouchers</span>
        </h1>
      </div>

      {/* Redeem code */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 mb-4">
        <div className="font-heading font-bold text-xs text-t2 mb-2">Have a code?</div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter promo code"
            value={redeemInput}
            onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
            className="flex-1 bg-dark3 border border-bd rounded-xl px-3 py-2.5 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors font-heading font-bold tracking-wider"
          />
          <button
            onClick={handleRedeem}
            className="bg-primary text-white font-heading font-bold text-sm px-5 rounded-xl active:bg-primary-dark transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Active promos */}
      <div className="px-[18px] mb-3">
        <h2 className="font-heading font-extrabold text-sm">Available Promos ({activePromos.length})</h2>
      </div>
      <div className="px-[18px] pb-24 space-y-3">
        {activePromos.map((promo) => (
          <div
            key={promo.code}
            className={`bg-gradient-to-r ${promo.gradient} border ${promo.border} rounded-[18px] p-4`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">{promo.emoji}</div>
              <div className="flex-1">
                <div className="font-heading font-bold text-sm">{promo.title}</div>
                <div className="text-[11px] text-t2 mt-0.5">{promo.description}</div>
              </div>
              <div className={`${promo.color} font-heading font-black text-sm`}>{promo.discount}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-[10px] text-t3">
                <span>{promo.minOrder}</span>
                <span>·</span>
                <span>Expires {promo.validUntil}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(promo.code).catch(() => {});
                  showToast(`✓ Code "${promo.code}" copied`);
                }}
                className="bg-white/80 border border-bd rounded-lg px-3 py-1.5 font-heading font-bold text-[11px] tracking-wider active:scale-95 transition-transform"
              >
                {promo.code}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

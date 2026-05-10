"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AreaSelector } from "@/components/AreaSelector";
import { RestaurantCard } from "@/components/RestaurantCard";
import { fetchRestaurants, type Restaurant } from "@/lib/data";
import { useWalletStore, useLoyaltyStore } from "@/lib/store";

const services = [
  { label: "Food", emoji: "🍽️", href: "/food", bg: "rgba(232,80,58,0.12)", border: "rgba(232,80,58,0.25)" },
  { label: "Ride", emoji: "🚗", href: "/ride", bg: "rgba(30,158,90,0.12)", border: "rgba(30,158,90,0.3)" },
  { label: "Groceries", emoji: "🛒", href: "/groceries", bg: "rgba(204,31,26,0.12)", border: "rgba(204,31,26,0.25)", badge: "PnP" },
  { label: "Pharmacy", emoji: "💊", href: "/pharmacy", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  { label: "Parcels", emoji: "📦", href: "/parcels", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  { label: "Laundry", emoji: "👔", href: "/laundry", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)" },
  { label: "Services", emoji: "🔧", href: "/services", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)" },
  { label: "Go to Sea", emoji: "⚓", href: "/explore", bg: "rgba(14,158,194,0.12)", border: "rgba(14,158,194,0.3)" },
  { label: "Guest Houses", emoji: "🏡", href: "/stays", bg: "rgba(30,158,90,0.12)", border: "rgba(30,158,90,0.2)" },
  { label: "Dog Walker", emoji: "🐕", href: "/explore", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.2)" },
  { label: "Fresh Fish", emoji: "🐟", href: "/explore", bg: "rgba(14,122,153,0.15)", border: "rgba(14,158,194,0.25)" },
  { label: "More", emoji: "➕", href: "/explore", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)" },
];

const promos = [
  { code: "SEA20", emoji: "⚓", title: "Go to Sea", desc: "20% off boat experiences", bg: "linear-gradient(135deg,#e8f7ef,#d6f0e2)", border: "rgba(30,158,90,0.2)", codeBg: "rgba(30,158,90,0.12)", codeColor: "#167042" },
  { code: "FRESHFISH", emoji: "🐟", title: "Catch of the Day", desc: "R30 off fresh fish delivery", bg: "linear-gradient(135deg,#e4f5fa,#d0ecf5)", border: "rgba(14,158,194,0.2)", codeBg: "rgba(14,158,194,0.12)", codeColor: "#0A7A99" },
  { code: "PNPSAVE", emoji: "🛒", title: "PnP Smart Deal", desc: "R50 off grocery orders R300+", bg: "linear-gradient(135deg,#fde8e8,#f9d5d5)", border: "rgba(204,31,26,0.2)", codeBg: "rgba(204,31,26,0.12)", codeColor: "#cc1f1a" },
  { code: "NEWUSER", emoji: "⭐", title: "Welcome Offer", desc: "40% off your first order", bg: "linear-gradient(135deg,#fef5e3,#fcedd0)", border: "rgba(245,166,35,0.2)", codeBg: "rgba(245,166,35,0.12)", codeColor: "#b87a0a" },
];

export function HomeScreen() {
  const walletBalance = useWalletStore((s) => s.balance);
  const { tier, points } = useLoyaltyStore();
  const tierEmoji = tier === "Bronze" ? "🥉" : tier === "Silver" ? "🥈" : tier === "Gold" ? "🥇" : "💎";
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    fetchRestaurants().then(setRestaurants);
  }, []);

  const popularRestaurants = restaurants.filter((r) => !r.closed).slice(0, 2);

  return (
    <div>
      {/* Location row */}
      <div className="flex items-center justify-between px-[18px] pt-3">
        <AreaSelector />
        <div className="flex gap-2 items-center">
          <Link href="/wallet" className="bg-primary/10 border border-primary/25 rounded-full px-3 py-1.5 flex items-center gap-1">
            <span className="text-xs">💰</span>
            <span className="font-heading font-bold text-[11px] text-primary">R{walletBalance}</span>
          </Link>
          <Link href="/notifications" className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg relative">
            🔔
            <span className="absolute top-[9px] right-[9px] w-[7px] h-[7px] bg-coral rounded-full border-[1.5px] border-white" />
          </Link>
          <Link href="/profile" className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center font-heading font-black text-base">
            E
          </Link>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-[18px] pt-3.5 pb-3">
        <h1 className="font-heading font-black text-2xl tracking-tight leading-tight mb-3.5">
          Good morning 👋
          <br />
          <span className="text-t2 font-semibold text-[19px]">What do you need?</span>
        </h1>
        <Link
          href="/search"
          className="flex items-center gap-2.5 bg-dark3 border-[1.5px] border-bd rounded-[14px] px-4 py-3.5"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(17,24,39,0.3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="text-sm text-t3">Food, rides, pharmacy, services...</span>
        </Link>
      </div>

      {/* Weather */}
      <div className="mx-[18px] p-3 px-4 bg-dark3 border border-primary/20 rounded-[14px] flex items-center gap-3 mb-4">
        <span className="text-xl">🌤️</span>
        <span className="font-heading font-bold text-[13px]">21°C</span>
        <div className="w-px h-3.5 bg-bd2" />
        <span className="text-xs text-t2">Partly Cloudy · Struisbaai</span>
        <div className="ml-auto bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-primary/25 font-heading">
          Live
        </div>
      </div>

      {/* Loyalty */}
      <Link href="/loyalty" className="block mx-[18px] mb-4">
        <div className="flex items-center gap-2.5 bg-dark2 border border-bd rounded-[14px] p-3 px-3.5">
          <span className="text-lg">{tierEmoji}</span>
          <span className="font-heading font-bold text-[12px]">{tier}</span>
          <span className="text-[11px] text-t2">·</span>
          <span className="text-[11px] text-primary font-heading font-bold">{points.toLocaleString()} pts</span>
          <span className="ml-auto text-primary text-xs font-heading font-bold">View →</span>
        </div>
      </Link>

      {/* Services */}
      <div className="px-[18px] pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-black text-base">Services</h2>
          <Link href="/explore" className="font-heading font-semibold text-xs text-primary">
            Explore all
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {services.map((svc) => (
            <Link key={svc.label} href={svc.href} className="flex flex-col items-center gap-1.5">
              <div
                className="w-[58px] h-[58px] rounded-[20px] flex items-center justify-center text-2xl border-[1.5px] active:scale-[0.93] transition-transform relative"
                style={{ background: svc.bg, borderColor: svc.border }}
              >
                {svc.emoji}
                {svc.badge && (
                  <div className="absolute -bottom-1 -right-1 bg-[#cc1f1a] text-white text-[7px] font-black px-1 rounded font-heading">
                    {svc.badge}
                  </div>
                )}
              </div>
              <span className="font-heading font-semibold text-[10px] text-t2 text-center leading-tight">
                {svc.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Promos */}
      <div className="mb-4">
        <div className="px-[18px] flex items-center justify-between mb-3">
          <h2 className="font-heading font-black text-base">Deals for you</h2>
          <Link href="/promos" className="font-heading font-semibold text-xs text-primary">See all</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-[18px] pb-1 no-scrollbar">
          {promos.map((p) => (
            <div
              key={p.code}
              className="shrink-0 w-[200px] rounded-[18px] p-4 border active:scale-[0.97] transition-transform"
              style={{ background: p.bg, borderColor: p.border }}
            >
              <div className="flex justify-between items-start">
                <span className="text-2xl">{p.emoji}</span>
                <span
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-full font-heading tracking-wide"
                  style={{ background: p.codeBg, color: p.codeColor }}
                >
                  {p.code}
                </span>
              </div>
              <div className="font-heading font-bold text-[13px] text-t1 mt-2.5 mb-1">{p.title}</div>
              <div className="text-[11px] text-t2">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular */}
      <div className="px-[18px] pb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-black text-base">🔥 Popular right now</h2>
          <Link href="/food" className="font-heading font-semibold text-xs text-primary">
            See all
          </Link>
        </div>
        {popularRestaurants.map((r) => (
          <RestaurantCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}

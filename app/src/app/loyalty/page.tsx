"use client";

import Link from "next/link";
import { useLoyaltyStore, useToastStore } from "@/lib/store";

const tierBenefits = {
  Bronze: [
    { benefit: "Earn 1 point per R1 spent", active: true },
    { benefit: "Birthday bonus — 100 points", active: true },
    { benefit: "Access to basic promos", active: true },
  ],
  Silver: [
    { benefit: "Earn 1.5x points per R1", active: true },
    { benefit: "Free delivery on orders R200+", active: true },
    { benefit: "Priority customer support", active: true },
    { benefit: "Exclusive Silver deals", active: true },
  ],
  Gold: [
    { benefit: "Earn 2x points per R1", active: false },
    { benefit: "Free delivery on all orders", active: false },
    { benefit: "5% cashback on wallet payments", active: false },
    { benefit: "Early access to new features", active: false },
    { benefit: "R100 quarterly bonus", active: false },
  ],
  Platinum: [
    { benefit: "Earn 3x points per R1", active: false },
    { benefit: "Free delivery + priority dispatch", active: false },
    { benefit: "10% cashback on everything", active: false },
    { benefit: "Dedicated account manager", active: false },
    { benefit: "R250 quarterly bonus", active: false },
    { benefit: "VIP event invitations", active: false },
  ],
};

const tierColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Bronze: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", gradient: "from-amber-200 to-amber-100" },
  Silver: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", gradient: "from-slate-200 to-slate-100" },
  Gold: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", gradient: "from-yellow-200 to-yellow-100" },
  Platinum: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300", gradient: "from-violet-200 to-violet-100" },
};

const pointsHistory = [
  { description: "Harbour Café order", points: "+199", date: "Apr 26", type: "earn" },
  { description: "GoRide to L'Agulhas", points: "+68", date: "Apr 23", type: "earn" },
  { description: "Redeemed: Free delivery", points: "-200", date: "Apr 22", type: "redeem" },
  { description: "PnP groceries", points: "+312", date: "Apr 19", type: "earn" },
  { description: "Referral bonus", points: "+500", date: "Apr 18", type: "bonus" },
  { description: "Sea Adventures booking", points: "+380", date: "Apr 15", type: "earn" },
];

export default function LoyaltyPage() {
  const { points, tier, getTierProgress } = useLoyaltyStore();
  const showToast = useToastStore((s) => s.show);
  const progress = getTierProgress();
  const colors = tierColors[tier];
  const tiers = ["Bronze", "Silver", "Gold", "Platinum"];

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">
          Loyalty <span className="text-primary">Rewards</span>
        </h1>
      </div>

      {/* Tier card */}
      <div className={`mx-[18px] bg-gradient-to-br ${colors.gradient} border ${colors.border} rounded-[22px] p-5 mb-4 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/30 -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{tier === "Bronze" ? "🥉" : tier === "Silver" ? "🥈" : tier === "Gold" ? "🥇" : "💎"}</span>
            <span className={`font-heading font-black text-lg ${colors.text}`}>{tier} Member</span>
          </div>
          <div className="font-heading font-black text-3xl text-t1 mb-1">
            {points.toLocaleString()} <span className="text-base font-bold text-t2">points</span>
          </div>
          {progress.next && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-t2 font-heading font-semibold mb-1.5">
                <span>{tier}</span>
                <span>{progress.pointsToNext.toLocaleString()} pts to {progress.next}</span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress.progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tier roadmap */}
      <div className="px-[18px] mb-4">
        <div className="flex items-center justify-between">
          {tiers.map((t, i) => {
            const isActive = tiers.indexOf(tier) >= i;
            const tc = tierColors[t];
            return (
              <div key={t} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? `${tc.bg} ${tc.text} border-2 ${tc.border}`
                        : "bg-dark3 border border-bd text-t3"
                    }`}
                  >
                    {t === "Bronze" ? "🥉" : t === "Silver" ? "🥈" : t === "Gold" ? "🥇" : "💎"}
                  </div>
                  <span className="text-[9px] mt-1 font-heading font-semibold text-t2">{t}</span>
                </div>
                {i < tiers.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-1 rounded-full ${isActive && tiers.indexOf(tier) > i ? "bg-primary" : "bg-dark3"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current tier benefits */}
      <div className="px-[18px] mb-4">
        <h3 className="font-heading font-extrabold text-sm mb-3">Your {tier} Benefits</h3>
        <div className="bg-dark2 border border-bd rounded-[18px] p-4 space-y-2.5">
          {tierBenefits[tier].map((b) => (
            <div key={b.benefit} className="flex items-center gap-2.5">
              <span className="text-primary text-sm">✓</span>
              <span className="text-[13px]">{b.benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next tier preview */}
      {progress.next && (
        <div className="px-[18px] mb-4">
          <h3 className="font-heading font-extrabold text-sm mb-3">Unlock with {progress.next}</h3>
          <div className="bg-dark2 border border-bd rounded-[18px] p-4 space-y-2.5 opacity-70">
            {tierBenefits[progress.next as keyof typeof tierBenefits]?.slice(0, 3).map((b) => (
              <div key={b.benefit} className="flex items-center gap-2.5">
                <span className="text-t3 text-sm">🔒</span>
                <span className="text-[13px] text-t2">{b.benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redeem */}
      <div className="px-[18px] mb-4">
        <h3 className="font-heading font-extrabold text-sm mb-3">Redeem Points</h3>
        <div className="flex gap-3">
          {[
            { label: "Free Delivery", pts: 200, emoji: "🚚" },
            { label: "R25 Voucher", pts: 500, emoji: "🎟️" },
            { label: "R50 Voucher", pts: 900, emoji: "💰" },
          ].map((r) => (
            <button
              key={r.label}
              onClick={() => {
                if (points >= r.pts) {
                  showToast(`✓ Redeemed: ${r.label}`);
                } else {
                  showToast(`Need ${r.pts - points} more points`);
                }
              }}
              className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3 text-center active:scale-[0.97] transition-transform"
            >
              <div className="text-xl mb-1">{r.emoji}</div>
              <div className="font-heading font-bold text-[11px]">{r.label}</div>
              <div className="text-[10px] text-primary font-heading font-bold mt-0.5">{r.pts} pts</div>
            </button>
          ))}
        </div>
      </div>

      {/* Points history */}
      <div className="px-[18px] pb-24">
        <h3 className="font-heading font-extrabold text-sm mb-3">Points History</h3>
        <div className="bg-dark2 border border-bd rounded-[18px] overflow-hidden">
          {pointsHistory.map((p, i) => (
            <div
              key={p.description + p.date}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < pointsHistory.length - 1 ? "border-b border-bd" : ""
              }`}
            >
              <div className="flex-1">
                <div className="font-heading font-bold text-[13px]">{p.description}</div>
                <div className="text-[10px] text-t3">{p.date}</div>
              </div>
              <span
                className={`font-heading font-black text-sm ${
                  p.type === "redeem" ? "text-coral" : "text-primary"
                }`}
              >
                {p.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

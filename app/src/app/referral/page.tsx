"use client";

import Link from "next/link";
import { useToastStore } from "@/lib/store";

const referralCode = "EUGENE50";

const referrals = [
  { name: "Pieter V.", status: "Joined", date: "Apr 24", earned: "R50", emoji: "✅" },
  { name: "Annemarie S.", status: "Joined", date: "Apr 18", earned: "R50", emoji: "✅" },
  { name: "Johan D.", status: "Pending", date: "Apr 27", earned: "—", emoji: "⏳" },
  { name: "Lizel M.", status: "Pending", date: "Apr 26", earned: "—", emoji: "⏳" },
];

const milestones = [
  { count: 3, reward: "R50 bonus", reached: false },
  { count: 5, reward: "R100 bonus", reached: false },
  { count: 10, reward: "Gold tier + R250", reached: false },
];

export default function ReferralPage() {
  const showToast = useToastStore((s) => s.show);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(referralCode).catch(() => {});
    showToast("✓ Referral code copied!");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join OverBerg Go!",
        text: `Use my code ${referralCode} to get R25 off your first order on OverBerg Go — food, rides, and experiences in the Overberg!`,
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">Refer & Earn</h1>
      </div>

      {/* Hero */}
      <div className="mx-[18px] bg-gradient-to-br from-primary/[0.08] to-sea/[0.05] border border-primary/20 rounded-[22px] p-5 text-center mb-4">
        <div className="text-4xl mb-3">🎁</div>
        <h2 className="font-heading font-black text-xl mb-1">Give R25, Get R50</h2>
        <p className="text-[13px] text-t2 leading-relaxed">
          Share OverBerg Go with friends. They get R25 off their first order, you earn R50 when they complete it.
        </p>
      </div>

      {/* Code */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 mb-4">
        <div className="text-[11px] text-t3 font-heading font-semibold mb-2 text-center">YOUR REFERRAL CODE</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-dark3 border-2 border-dashed border-primary/30 rounded-xl py-3 text-center">
            <span className="font-heading font-black text-xl tracking-[0.2em] text-primary">{referralCode}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="w-12 h-12 bg-dark3 border border-bd rounded-xl flex items-center justify-center text-lg active:scale-95 transition-transform"
          >
            📋
          </button>
        </div>
        <button
          onClick={handleShare}
          className="w-full bg-primary text-white font-heading font-bold text-sm py-3.5 rounded-2xl mt-3 active:bg-primary-dark active:scale-[0.98] transition-all"
        >
          Share with Friends
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-[18px] mb-4">
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-primary">2</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Joined</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-sun">2</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Pending</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-primary">R100</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Earned</div>
        </div>
      </div>

      {/* Milestones */}
      <div className="px-[18px] mb-4">
        <h3 className="font-heading font-extrabold text-sm mb-3">Milestones</h3>
        <div className="bg-dark2 border border-bd rounded-[18px] p-4 space-y-3">
          {milestones.map((m) => (
            <div key={m.count} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-heading font-bold ${
                m.reached ? "bg-primary text-white" : "bg-dark3 border border-bd text-t3"
              }`}>
                {m.count}
              </div>
              <div className="flex-1">
                <div className="font-heading font-bold text-[13px]">{m.count} referrals</div>
                <div className="text-[11px] text-t2">{m.reward}</div>
              </div>
              {m.reached && <span className="text-primary font-bold text-sm">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Referral list */}
      <div className="px-[18px] pb-24">
        <h3 className="font-heading font-extrabold text-sm mb-3">Your Referrals</h3>
        <div className="bg-dark2 border border-bd rounded-[18px] overflow-hidden">
          {referrals.map((ref, i) => (
            <div
              key={ref.name}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i < referrals.length - 1 ? "border-b border-bd" : ""
              }`}
            >
              <span className="text-lg">{ref.emoji}</span>
              <div className="flex-1">
                <div className="font-heading font-bold text-sm">{ref.name}</div>
                <div className="text-[10px] text-t3">{ref.date}</div>
              </div>
              <div className="text-right">
                <div className={`font-heading font-bold text-xs ${ref.status === "Joined" ? "text-primary" : "text-sun"}`}>
                  {ref.status}
                </div>
                <div className="text-[10px] text-t2">{ref.earned}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

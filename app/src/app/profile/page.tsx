"use client";

import Link from "next/link";
import { useWalletStore, useLoyaltyStore } from "@/lib/store";

const menuItems = [
  { icon: "💰", title: "GoWallet", sub: "", bg: "rgba(30,158,90,0.1)", href: "/wallet", dynamic: "wallet" },
  { icon: "❤️", title: "Favorites", sub: "Saved restaurants & experiences", bg: "rgba(232,80,58,0.1)", href: "/favorites" },
  { icon: "💳", title: "Payment Methods", sub: "Visa ···4521 · PayFast · SnapScan", bg: "rgba(30,158,90,0.1)", href: "" },
  { icon: "📍", title: "Saved Addresses", sub: "Home · Work · 3 more", bg: "rgba(14,158,194,0.1)", href: "/addresses" },
  { icon: "🎁", title: "Refer & Earn", sub: "Share OverBerg Go · Earn R50 per referral", bg: "rgba(168,85,247,0.1)", href: "/referral" },
  { icon: "🎟️", title: "Promos & Vouchers", sub: "6 active promos available", bg: "rgba(245,166,35,0.1)", href: "/promos" },
];

export default function ProfilePage() {
  const walletBalance = useWalletStore((s) => s.balance);
  const { tier, points, getTierProgress } = useLoyaltyStore();
  const progress = getTierProgress();

  const tierEmoji = tier === "Bronze" ? "🥉" : tier === "Silver" ? "🥈" : tier === "Gold" ? "🥇" : "💎";

  return (
    <div>
      {/* Hero */}
      <div className="text-center pt-6 pb-5">
        <div className="w-[72px] h-[72px] rounded-[22px] bg-primary mx-auto flex items-center justify-center font-heading font-black text-3xl mb-3">
          E
        </div>
        <div className="font-heading font-black text-xl">Eugene Hefer</div>
        <div className="text-xs text-t2 mt-1">📍 Marine 127, Struisbaai · Member since 2026</div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-[18px] mb-3">
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-primary">18</div>
          <div className="text-[10px] text-t2 font-heading font-semibold mt-0.5">Orders</div>
        </div>
        <Link href="/wallet" className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-primary">R{walletBalance}</div>
          <div className="text-[10px] text-t2 font-heading font-semibold mt-0.5">Wallet</div>
        </Link>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-sun">R80</div>
          <div className="text-[10px] text-t2 font-heading font-semibold mt-0.5">Saved</div>
        </div>
      </div>

      {/* Loyalty tier */}
      <Link href="/loyalty" className="block mx-[18px] mb-5">
        <div className="bg-gradient-to-r from-primary/[0.06] to-sea/[0.04] border border-primary/15 rounded-[16px] p-3.5 flex items-center gap-3">
          <span className="text-2xl">{tierEmoji}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-[13px]">{tier} Member</span>
              <span className="text-[10px] text-primary font-heading font-bold">{points.toLocaleString()} pts</span>
            </div>
            {progress.next && (
              <div className="mt-1.5">
                <div className="h-1.5 bg-dark4 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-sea rounded-full"
                    style={{ width: `${progress.progress * 100}%` }}
                  />
                </div>
                <div className="text-[9px] text-t3 mt-0.5">{progress.pointsToNext.toLocaleString()} pts to {progress.next}</div>
              </div>
            )}
          </div>
          <span className="text-primary text-lg font-bold">›</span>
        </div>
      </Link>

      {/* Menu */}
      <div className="px-[18px] space-y-2">
        {menuItems.map((item) => {
          const sub = item.dynamic === "wallet" ? `Balance: R${walletBalance} · Top up` : item.sub;
          const content = (
            <div className="flex items-center gap-3 bg-dark2 border border-bd rounded-[16px] p-4">
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg" style={{ background: item.bg }}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-heading font-bold text-sm">{item.title}</div>
                <div className="text-[11px] text-t2 mt-0.5">{sub}</div>
              </div>
              <span className="text-t3 text-lg">›</span>
            </div>
          );
          if (item.href) {
            return <Link key={item.title} href={item.href}>{content}</Link>;
          }
          return <div key={item.title}>{content}</div>;
        })}

        {/* Driver & Restaurant links */}
        <Link href="/driver" className="flex items-center gap-3 bg-dark2 border border-bd rounded-[16px] p-4">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg" style={{ background: "rgba(30,158,90,0.1)" }}>
            🚗
          </div>
          <div className="flex-1">
            <div className="font-heading font-bold text-sm">Driver Dashboard</div>
            <div className="text-[11px] text-t2 mt-0.5">View driver earnings & trips</div>
          </div>
          <span className="text-primary text-lg font-bold">›</span>
        </Link>

        <Link href="/vendor" className="flex items-center gap-3 bg-dark2 border border-bd rounded-[16px] p-4">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg" style={{ background: "rgba(14,158,194,0.1)" }}>
            🍽️
          </div>
          <div className="flex-1">
            <div className="font-heading font-bold text-sm">Restaurant Dashboard</div>
            <div className="text-[11px] text-t2 mt-0.5">Manage orders & menu</div>
          </div>
          <span className="text-sea text-lg font-bold">›</span>
        </Link>

        {/* Settings */}
        <Link href="/settings" className="flex items-center gap-3 bg-dark2 border border-bd rounded-[16px] p-4">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg bg-black/[0.04]">⚙️</div>
          <div className="flex-1">
            <div className="font-heading font-bold text-sm">Settings</div>
            <div className="text-[11px] text-t2 mt-0.5">Notifications · Privacy · Help</div>
          </div>
          <span className="text-t3 text-lg">›</span>
        </Link>

        {/* Footer */}
        <div className="mt-5 p-4 bg-gradient-to-br from-primary/[0.08] to-sea/[0.05] border border-primary/20 rounded-[18px] text-center">
          <div className="text-[22px] mb-2">🌿</div>
          <div className="font-heading font-extrabold text-sm mb-1">Built for the Overberg</div>
          <div className="text-xs text-t2 leading-relaxed">
            Struisbaai · L&apos;Agulhas · Arniston · Bredasdorp and the wider Overberg
          </div>
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}

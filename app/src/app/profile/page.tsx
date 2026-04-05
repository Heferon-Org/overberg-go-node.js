"use client";

import Link from "next/link";

const menuItems = [
  { icon: "💳", title: "Payment Methods", sub: "Visa ···4521 · PayFast · SnapScan", bg: "rgba(30,158,90,0.1)" },
  { icon: "📍", title: "Saved Addresses", sub: "Home · Work · 3 more", bg: "rgba(14,158,194,0.1)" },
  { icon: "⭐", title: "Smart Shopper", sub: "3,240 points · Linked ✓", bg: "rgba(245,166,35,0.1)" },
  { icon: "🎁", title: "Refer & Earn", sub: "Share OverBerg Go · Earn R50 per referral", bg: "rgba(168,85,247,0.1)" },
];

export default function ProfilePage() {
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
      <div className="flex gap-3 px-[18px] mb-5">
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-primary">18</div>
          <div className="text-[10px] text-t2 font-heading font-semibold mt-0.5">Orders</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-sea">3,240</div>
          <div className="text-[10px] text-t2 font-heading font-semibold mt-0.5">Smart pts</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-sun">R80</div>
          <div className="text-[10px] text-t2 font-heading font-semibold mt-0.5">Saved</div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-[18px] space-y-2">
        {menuItems.map((item) => (
          <div key={item.title} className="flex items-center gap-3 bg-dark2 border border-bd rounded-[16px] p-4">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg" style={{ background: item.bg }}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="font-heading font-bold text-sm">{item.title}</div>
              <div className="text-[11px] text-t2 mt-0.5">{item.sub}</div>
            </div>
            <span className="text-t3 text-lg">›</span>
          </div>
        ))}

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
        <div className="flex items-center gap-3 bg-dark2 border border-bd rounded-[16px] p-4">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-lg bg-white/[0.06]">⚙️</div>
          <div className="flex-1">
            <div className="font-heading font-bold text-sm">Settings</div>
            <div className="text-[11px] text-t2 mt-0.5">Notifications · Privacy · Help</div>
          </div>
          <span className="text-t3 text-lg">›</span>
        </div>

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

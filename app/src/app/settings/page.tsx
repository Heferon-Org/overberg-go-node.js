"use client";

import Link from "next/link";
import { useToastStore } from "@/lib/store";

const sections = [
  {
    title: "Account",
    items: [
      { icon: "👤", label: "Edit Profile", sub: "Name, email, phone number" },
      { icon: "📍", label: "Saved Addresses", sub: "Home, Work, and more" },
      { icon: "💳", label: "Payment Methods", sub: "Visa ···4521, PayFast, SnapScan" },
      { icon: "⭐", label: "Smart Shopper", sub: "3,240 points · Linked" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: "🔔", label: "Notifications", sub: "Push, email, SMS preferences" },
      { icon: "🌍", label: "Language", sub: "English" },
      { icon: "🌙", label: "Appearance", sub: "Dark mode (default)" },
      { icon: "📏", label: "Distance Units", sub: "Kilometres" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "❓", label: "Help Centre", sub: "FAQs and support articles" },
      { icon: "💬", label: "Contact Us", sub: "Chat, email, or phone" },
      { icon: "📋", label: "Report an Issue", sub: "Food quality, delivery, app bugs" },
      { icon: "📜", label: "Terms & Privacy", sub: "Terms of Service, Privacy Policy" },
    ],
  },
];

export default function SettingsPage() {
  const showToast = useToastStore((s) => s.show);

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">Settings</h1>
      </div>

      <div className="px-[18px] pb-24">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <h2 className="font-heading font-bold text-xs text-t3 uppercase tracking-wider mb-2">
              {section.title}
            </h2>
            <div className="bg-dark2 border border-bd rounded-[18px] overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => showToast(`${item.label} — coming soon`)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/[0.03] transition-colors ${
                    i < section.items.length - 1 ? "border-b border-bd" : ""
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-sm">{item.label}</div>
                    <div className="text-[11px] text-t2 mt-0.5">{item.sub}</div>
                  </div>
                  <span className="text-t3 text-lg">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* App info */}
        <div className="bg-dark2 border border-bd rounded-[18px] p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading font-bold text-sm">App Version</span>
            <span className="text-xs text-t2">1.0.0 (PWA)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-heading font-bold text-sm">Region</span>
            <span className="text-xs text-t2">Overberg, Western Cape</span>
          </div>
        </div>

        {/* Logout */}
        <Link
          href="/auth"
          className="w-full bg-coral/10 border border-coral/25 text-coral font-heading font-bold text-sm rounded-2xl py-4 text-center block active:scale-[0.98] transition-transform"
        >
          Log Out
        </Link>

        <p className="text-center text-[10px] text-t3 mt-4">
          Made with 🌿 in the Overberg
        </p>
      </div>
    </div>
  );
}

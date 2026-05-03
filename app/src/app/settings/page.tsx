"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToastStore } from "@/lib/store";
import { useLocale } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";

export default function SettingsPage() {
  const showToast = useToastStore((s) => s.show);
  const t = useTranslations("settings");
  const [locale, setLocale] = useLocale();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const sections = [
    {
      title: t("account"),
      items: [
        { icon: "👤", label: "Edit Profile", sub: "Name, email, phone number" },
        { icon: "📍", label: "Saved Addresses", sub: "Home, Work, and more" },
        { icon: "💳", label: "Payment Methods", sub: "Visa ···4521, PayFast, SnapScan" },
        { icon: "⭐", label: "Smart Shopper", sub: "3,240 points · Linked" },
      ],
    },
    {
      title: t("preferences"),
      items: [
        { icon: "🔔", label: t("notifications"), sub: "Push, email, SMS preferences" },
        { icon: "🌍", label: t("language"), sub: locale === "af" ? "Afrikaans" : "English", action: () => setShowLangPicker(true) },
        { icon: "🌙", label: t("darkMode"), sub: "Dark mode (default)" },
        { icon: "📏", label: "Distance Units", sub: "Kilometres" },
      ],
    },
    {
      title: t("support"),
      items: [
        { icon: "❓", label: t("helpCenter"), sub: "FAQs and support articles" },
        { icon: "💬", label: t("contactUs"), sub: "Chat, email, or phone" },
        { icon: "📋", label: "Report an Issue", sub: "Food quality, delivery, app bugs" },
        { icon: "📜", label: "Terms & Privacy", sub: "Terms of Service, Privacy Policy" },
      ],
    },
  ];

  function handleLanguageChange(l: Locale) {
    setLocale(l);
    setShowLangPicker(false);
    showToast(l === "af" ? "✓ Taal verander na Afrikaans" : "✓ Language changed to English");
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">{t("title")}</h1>
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
                  onClick={() => {
                    if ("action" in item && item.action) item.action();
                    else showToast(`${item.label} — coming soon`);
                  }}
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
            <span className="font-heading font-bold text-sm">{t("version")}</span>
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
          {t("logout")}
        </Link>

        <p className="text-center text-[10px] text-t3 mt-4">
          Made with 🌿 in the Overberg
        </p>
      </div>

      {/* Language picker modal */}
      {showLangPicker && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-6" onClick={() => setShowLangPicker(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-[320px] w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-black text-lg mb-4 text-center">{t("language")}</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-colors ${locale === "en" ? "border-primary bg-primary/5" : "border-bd"}`}
              >
                <span className="text-xl">🇬🇧</span>
                <span className="font-heading font-bold text-sm">English</span>
                {locale === "en" && <span className="ml-auto text-primary font-bold">✓</span>}
              </button>
              <button
                onClick={() => handleLanguageChange("af")}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-colors ${locale === "af" ? "border-primary bg-primary/5" : "border-bd"}`}
              >
                <span className="text-xl">🇿🇦</span>
                <span className="font-heading font-bold text-sm">Afrikaans</span>
                {locale === "af" && <span className="ml-auto text-primary font-bold">✓</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

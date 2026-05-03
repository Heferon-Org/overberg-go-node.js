"use client";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { useEffect, useState } from "react";
import { type Locale, defaultLocale, getMessages } from "./config";

const LOCALE_KEY = "obg_locale";

function detectLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === "af" || stored === "en") return stored;
  const browserLang = navigator.language || "";
  if (browserLang.startsWith("af")) return "af";
  return defaultLocale;
}

export function useLocale(): [Locale, (l: Locale) => void] {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  function setLocale(l: Locale) {
    localStorage.setItem(LOCALE_KEY, l);
    setLocaleState(l);
  }

  return [locale, setLocale];
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useLocale();
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    getMessages(locale).then(setMessages);
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasChosen = localStorage.getItem(LOCALE_KEY);
    if (!hasChosen) setShowPicker(true);
  }, []);

  if (!messages) return null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
      {showPicker && (
        <LanguagePicker
          onSelect={(l) => {
            setLocale(l);
            setShowPicker(false);
          }}
        />
      )}
    </NextIntlClientProvider>
  );
}

function LanguagePicker({ onSelect }: { onSelect: (l: Locale) => void }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-[340px] w-full text-center">
        <div className="text-4xl mb-4">🌊</div>
        <h2 className="font-heading font-black text-xl mb-1">Choose Language</h2>
        <p className="text-sm text-t2 mb-6">Kies jou taal</p>
        <div className="space-y-3">
          <button
            onClick={() => onSelect("en")}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-bd hover:border-primary transition-colors"
          >
            <span className="text-2xl">🇬🇧</span>
            <div className="text-left">
              <div className="font-heading font-bold text-sm">English</div>
              <div className="text-[11px] text-t2">Continue in English</div>
            </div>
          </button>
          <button
            onClick={() => onSelect("af")}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-bd hover:border-primary transition-colors"
          >
            <span className="text-2xl">🇿🇦</span>
            <div className="text-left">
              <div className="font-heading font-bold text-sm">Afrikaans</div>
              <div className="text-[11px] text-t2">Gaan voort in Afrikaans</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

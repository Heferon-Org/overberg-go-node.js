"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISIT_KEY = "obg_visits";
const DISMISSED_KEY = "obg_a2hs_dismissed";

export function AddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const visits = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(visits));

    if (visits < 2) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9998] bg-white border border-bd rounded-2xl p-4 shadow-xl shadow-black/10 flex items-center gap-3">
      <div className="w-12 h-12 rounded-[16px] bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
        <span className="text-2xl">🌿</span>
      </div>
      <div className="flex-1">
        <div className="font-heading font-bold text-sm">Add to Home Screen</div>
        <div className="text-[11px] text-t2 mt-0.5">Get the full app experience</div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={handleDismiss} className="text-xs text-t3 font-heading font-bold px-2">
          Later
        </button>
        <button onClick={handleInstall} className="bg-primary text-white text-xs font-heading font-bold px-4 py-2 rounded-xl">
          Install
        </button>
      </div>
    </div>
  );
}

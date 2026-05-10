"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isNative } from "@/lib/capacitor";

export function DedicatedAppCTA() {
  const [role, setRole] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isNative()) return;
    if (typeof window !== "undefined" && localStorage.getItem("obg_app_cta_dismissed")) return;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const profileRole = (data as { role: string } | null)?.role;
      if (profileRole && (profileRole === "driver" || profileRole === "vendor" || profileRole === "provider")) {
        setRole(profileRole);
      }
    })();
  }, [supabase]);

  if (!role || dismissed || isNative()) return null;

  const appName = role === "driver" ? "OverBerg Go Driver" : "OverBerg Go for Business";
  const icon = role === "driver" ? "🚗" : role === "vendor" ? "🏪" : "🔧";

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("obg_app_cta_dismissed", "1");
  }

  return (
    <div className="mx-4 mb-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 text-white relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/50 text-sm"
      >
        &times;
      </button>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="font-semibold text-sm">Get {appName}</p>
          <p className="text-xs text-white/70">The dedicated app for {role}s with optimized features</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <a
          href="https://apps.apple.com/search?term=overberg+go"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-white/10 rounded-xl text-center text-xs font-medium"
        >
          App Store
        </a>
        <a
          href="https://play.google.com/store/search?q=overberg+go"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-white/10 rounded-xl text-center text-xs font-medium"
        >
          Play Store
        </a>
      </div>
    </div>
  );
}

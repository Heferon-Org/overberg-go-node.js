"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1500);
    const hideTimer = setTimeout(() => setVisible(false), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 bg-[#06121C] z-[999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-[24px] bg-primary/10 border border-primary/25 flex items-center justify-center">
          <span className="text-4xl">🌿</span>
        </div>
        <div className="absolute -inset-4 rounded-[32px] border border-primary/10 animate-ping" style={{ animationDuration: "2s" }} />
      </div>
      <h1 className="font-heading font-black text-2xl tracking-tight mb-1">OverBerg Go</h1>
      <p className="text-t3 text-xs font-heading">Struisbaai · L&apos;Agulhas · Arniston</p>
    </div>
  );
}

"use client";

import { useToastStore } from "@/lib/store";

export function Toast() {
  const message = useToastStore((s) => s.message);

  if (!message) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 bg-white border border-bd2 rounded-2xl px-5 py-3 z-[100] shadow-lg animate-in fade-in slide-in-from-top-2">
      <span className="font-heading font-bold text-sm text-t1">{message}</span>
    </div>
  );
}

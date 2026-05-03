"use client";

import { useState, useEffect } from "react";
import { isWithinServiceArea } from "@/lib/mapbox/geofence";
import { useToastStore } from "@/lib/store";

interface GeofenceGateProps {
  children: React.ReactNode;
}

export function GeofenceGate({ children }: GeofenceGateProps) {
  const [status, setStatus] = useState<"checking" | "inside" | "outside" | "unknown">("checking");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("unknown");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const inside = isWithinServiceArea(pos.coords.latitude, pos.coords.longitude);
        setStatus(inside ? "inside" : "outside");
      },
      () => {
        setStatus("unknown");
      },
      { timeout: 8000 }
    );
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">📍</div>
          <div className="font-heading font-bold text-sm text-t2">Checking your location...</div>
        </div>
      </div>
    );
  }

  if (status === "outside") {
    return (
      <div className="px-[18px] py-12 text-center">
        <div className="text-5xl mb-4">🌊</div>
        <h2 className="font-heading font-black text-xl mb-2">Coming soon to your area</h2>
        <p className="text-sm text-t2 mb-6 max-w-xs mx-auto">
          OverBerg Go currently serves the Cape Agulhas Municipality area. Join the waitlist to be notified when we expand!
        </p>

        {joined ? (
          <div className="bg-primary/10 border border-primary/25 rounded-2xl p-5 max-w-sm mx-auto">
            <div className="text-2xl mb-2">✓</div>
            <div className="font-heading font-bold text-sm text-primary">
              You&apos;re on the waitlist!
            </div>
            <div className="text-xs text-t2 mt-1">We&apos;ll notify you when we launch in your area.</div>
          </div>
        ) : (
          <div className="max-w-sm mx-auto space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-dark3 border border-bd rounded-xl px-4 py-3.5 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={() => {
                if (!email.includes("@")) {
                  showToast("Enter a valid email");
                  return;
                }
                setJoined(true);
                showToast("✓ Added to waitlist!");
              }}
              className="w-full bg-primary text-white font-heading font-bold text-sm py-3.5 rounded-2xl active:bg-primary-dark transition-colors"
            >
              Join Waitlist
            </button>
          </div>
        )}

        <div className="mt-8 bg-dark2 border border-bd rounded-2xl p-4 max-w-sm mx-auto">
          <div className="font-heading font-bold text-xs text-t2 mb-2">Current service area</div>
          <div className="text-xs text-t3">
            Struisbaai · L&apos;Agulhas · Bredasdorp · Arniston · Elim · Napier · Suiderstrand · Skipskop
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

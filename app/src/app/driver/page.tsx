"use client";

import { useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/lib/store";

const weekStats = [
  { title: "This week", value: "R2,840", color: "text-primary", sub: "47 trips · 6 days" },
  { title: "Acceptance rate", value: "92%", color: "text-t1", sub: "Top Driver tier" },
  { title: "Completion", value: "99%", color: "text-t1", sub: "0 cancellations" },
  { title: "Next payout", value: "R1,680", color: "text-sun", sub: "Thursday EFT" },
];

export default function DriverPage() {
  const [online, setOnline] = useState(true);
  const showToast = useToastStore((s) => s.show);

  return (
    <div>
      {/* Header */}
      <div className="px-[18px] pt-3">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Link href="/profile" className="text-t3 text-sm">←</Link>
              <h1 className="font-heading font-black text-xl tracking-tight">
                Driver <span className="text-primary">Dashboard</span>
              </h1>
            </div>
            <div className="text-[11px] text-t2 ml-6">Johan van der Berg · CA 834-GN</div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-heading font-bold text-xs text-primary">
              {online ? "Online" : "Offline"}
            </span>
            <button
              onClick={() => {
                setOnline(!online);
                showToast(online ? "Going offline..." : "✓ You are now online");
              }}
              className={`w-[44px] h-[24px] rounded-full relative transition-colors ${
                online ? "bg-primary" : "bg-dark3 border border-bd"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                  online ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Active status */}
        <div className="flex items-center gap-2 bg-primary/[0.08] border border-primary/20 rounded-xl p-2.5 px-3.5 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-live" />
          <span className="font-heading font-bold text-[13px]">Active · Struisbaai area</span>
          <span className="text-[11px] text-t2 ml-auto">3 riders nearby</span>
        </div>
      </div>

      {/* Earnings */}
      <div className="flex gap-3 px-[18px] mb-4">
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-primary">R428</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Today</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl">12</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Trips</div>
        </div>
        <div className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center">
          <div className="font-heading font-black text-xl text-sun">★ 4.93</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Rating</div>
        </div>
      </div>

      {/* Trip request */}
      <div className="px-[18px] mb-2">
        <div className="font-heading font-extrabold text-sm text-sun flex items-center gap-1.5 mb-2.5">
          <div className="w-2 h-2 rounded-full bg-sun animate-pulse-live" />
          New trip request
        </div>
      </div>
      <div className="mx-[18px] bg-dark2 border-2 border-sun/30 rounded-[18px] p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-heading font-bold text-sm">GoRide Request</div>
            <div className="text-[11px] text-t2 mt-0.5">3.2 km pickup · 8.1 km trip</div>
          </div>
          <div className="font-heading font-black text-xl text-primary">R68</div>
        </div>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs">Struisbaai Harbour, Main St</span>
          </div>
          <div className="w-[1.5px] h-4 bg-bd2 ml-1" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sea" />
            <span className="text-xs">Cape Agulhas Lighthouse, L&apos;Agulhas</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => showToast("Trip declined")}
            className="flex-1 bg-dark3 border border-bd text-t2 font-heading font-bold text-sm py-3 rounded-2xl active:scale-[0.98] transition-transform"
          >
            Decline
          </button>
          <button
            onClick={() => showToast("✓ Trip accepted! Navigate to pickup →")}
            className="flex-[2] bg-primary text-white font-heading font-bold text-sm py-3 rounded-2xl active:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Accept · R68
          </button>
        </div>
      </div>

      {/* Weekly stats */}
      <div className="grid grid-cols-2 gap-3 px-[18px] mb-4">
        {weekStats.map((s) => (
          <div key={s.title} className="bg-dark2 border border-bd rounded-[16px] p-3.5">
            <div className="text-[10px] text-t3 font-heading font-semibold mb-1">{s.title}</div>
            <div className={`font-heading font-black text-lg ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-t2 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Mini map */}
      <div className="px-[18px] mb-4">
        <div className="font-heading font-bold text-sm mb-2.5">Your area</div>
        <div className="h-[120px] bg-gradient-to-br from-[#e8f4f8] to-[#f0f7fa] rounded-[16px] relative overflow-hidden border border-bd">
          <div className="absolute inset-0 opacity-[0.08]">
            <div className="absolute top-1/3 left-0 right-0 h-[1.5px] bg-primary/70" />
            <div className="absolute top-2/3 left-0 right-0 h-[1.5px] bg-primary/70" />
            <div className="absolute left-1/3 top-0 bottom-0 w-[1.5px] bg-primary/50" />
            <div className="absolute left-2/3 top-0 bottom-0 w-[1.5px] bg-primary/50" />
          </div>
          <div className="absolute top-[40%] left-[45%] text-xl animate-car">🚗</div>
          <div className="absolute bottom-2.5 left-3.5 bg-primary/90 rounded-lg px-2.5 py-1.5 font-heading font-bold text-[11px]">
            📍 You — Struisbaai Harbour
          </div>
        </div>
      </div>

      <div className="px-[18px] pb-8">
        <button
          onClick={() => {
            setOnline(false);
            showToast("Going offline. See you next time!");
          }}
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-[17px] active:bg-primary-dark active:scale-[0.98] transition-all"
        >
          Go Offline
        </button>
      </div>
    </div>
  );
}

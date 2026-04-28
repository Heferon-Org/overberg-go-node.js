"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const steps = [
  { label: "Placed", icon: "✓", time: "09:41" },
  { label: "Confirmed", icon: "✓", time: "09:42" },
  { label: "Preparing", icon: "🍳", time: "09:43" },
  { label: "On the way", icon: "🛵", time: "" },
  { label: "Delivered", icon: "🏠", time: "" },
];

export default function TrackingPage() {
  const [currentStep, setCurrentStep] = useState(2);
  const [etaMinutes, setEtaMinutes] = useState(18);

  // Simulate order progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
      setEtaMinutes((prev) => Math.max(0, prev - 6));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const isDelivered = currentStep >= steps.length - 1;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/orders"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <div className="flex-1">
          <h1 className="font-heading font-black text-lg">Track Order</h1>
          <p className="text-xs text-t2">#OBG-2847 · Harbour Café</p>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">📞</div>
          <div className="w-10 h-10 rounded-xl bg-sea/10 border border-sea/25 flex items-center justify-center">💬</div>
        </div>
      </div>

      {/* Map area */}
      <div className="mx-[18px] h-[200px] rounded-[18px] bg-gradient-to-br from-[#e8f4f8] to-[#f0f7fa] relative overflow-hidden border border-bd mb-4">
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute top-1/4 left-0 right-0 h-px bg-primary" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-primary" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-primary" />
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-primary" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-primary" />
        </div>

        {/* Restaurant pin */}
        <div className="absolute top-[25%] left-[30%] flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-sea border-2 border-white shadow-lg" />
          <div className="mt-1 bg-white/90 backdrop-blur shadow-sm px-2 py-0.5 rounded text-[8px] font-heading font-bold whitespace-nowrap">
            Harbour Café
          </div>
        </div>

        {/* Delivery pin */}
        <div className="absolute top-[65%] left-[70%] flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow-lg" />
          <div className="mt-1 bg-white/90 backdrop-blur shadow-sm px-2 py-0.5 rounded text-[8px] font-heading font-bold whitespace-nowrap">
            Marine 127
          </div>
        </div>

        {/* Rider */}
        {currentStep >= 3 && !isDelivered && (
          <div className="absolute top-[45%] left-[50%] text-2xl animate-car">🛵</div>
        )}

        {/* ETA badge */}
        <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur rounded-xl px-3.5 py-2">
          <div className="font-heading font-extrabold text-[15px] text-white">
            {isDelivered ? "Delivered!" : `${etaMinutes} min`}
          </div>
          <div className="text-[10px] text-white/80">
            {isDelivered ? "Enjoy your meal" : "Estimated arrival"}
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          {isDelivered ? (
            <span className="text-2xl">🎉</span>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-live" />
          )}
          <span className="font-heading font-black text-base">
            {isDelivered
              ? "Order Delivered!"
              : steps[currentStep].label === "Preparing"
              ? "Your order is being prepared"
              : steps[currentStep].label === "On the way"
              ? "Your rider is on the way"
              : steps[currentStep].label}
          </span>
        </div>

        {/* Progress steps */}
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < currentStep
                      ? "bg-primary text-white"
                      : i === currentStep
                      ? "bg-primary/20 border-2 border-primary text-primary"
                      : "bg-dark3 border border-bd text-t3"
                  }`}
                >
                  {i < currentStep ? "✓" : step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 transition-colors ${
                      i < currentStep ? "bg-primary" : "bg-dark3"
                    }`}
                  />
                )}
              </div>
              <div className="pt-1.5">
                <div
                  className={`font-heading font-bold text-sm ${
                    i <= currentStep ? "text-t1" : "text-t3"
                  }`}
                >
                  {step.label}
                </div>
                {i <= currentStep && step.time && (
                  <div className="text-[10px] text-t2 mt-0.5">{step.time}</div>
                )}
                {i === currentStep && !isDelivered && (
                  <div className="text-[10px] text-primary mt-0.5 font-heading font-semibold">
                    In progress...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver card */}
      {currentStep >= 3 && (
        <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4 flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-dark3 flex items-center justify-center text-2xl">👤</div>
          <div className="flex-1">
            <div className="font-heading font-bold text-sm">Sipho Ndlovu</div>
            <div className="text-xs text-t2">★ 4.93 · Toyota Corolla</div>
            <div className="text-[10px] text-t3 mt-0.5">CA 234 567</div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">📞</div>
            <div className="w-10 h-10 rounded-xl bg-sea/10 border border-sea/25 flex items-center justify-center">💬</div>
          </div>
        </div>
      )}

      {/* Order summary */}
      <div className="mx-[18px] bg-dark2 border border-bd rounded-[18px] p-4">
        <h3 className="font-heading font-bold text-sm mb-3">Order Summary</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-t2">2x Calamari Rings</span>
            <span>R178</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t2">1x Harbour Mezze</span>
            <span>R145</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t2">2x Coke 330ml</span>
            <span>R50</span>
          </div>
          <div className="border-t border-bd pt-2 mt-2 flex justify-between font-heading font-bold text-sm">
            <span>Total</span>
            <span className="text-primary">R408</span>
          </div>
        </div>
      </div>
    </div>
  );
}

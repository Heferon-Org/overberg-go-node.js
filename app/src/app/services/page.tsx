"use client";

import Link from "next/link";
import { useToastStore } from "@/lib/store";

const serviceCategories = [
  {
    title: "Home Services",
    emoji: "🏠",
    services: [
      { id: "cleaning", name: "Home Cleaning", emoji: "🧹", price: "From R250", desc: "Deep clean, regular cleaning", bg: "rgba(30,158,90,0.12)", border: "rgba(30,158,90,0.25)" },
      { id: "laundry", name: "Laundry & Ironing", emoji: "👔", price: "From R120", desc: "Wash, dry, fold, iron", bg: "rgba(14,158,194,0.12)", border: "rgba(14,158,194,0.25)" },
      { id: "handyman", name: "Handyman", emoji: "🔧", price: "From R200/hr", desc: "Repairs, installations, assembly", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)" },
      { id: "electrician", name: "Electrician", emoji: "⚡", price: "From R350", desc: "Licensed electrician callout", bg: "rgba(232,80,58,0.12)", border: "rgba(232,80,58,0.25)" },
      { id: "plumber", name: "Plumber", emoji: "🔧", price: "From R300", desc: "Leaks, geysers, drains", bg: "rgba(14,158,194,0.12)", border: "rgba(14,158,194,0.25)" },
      { id: "garden", name: "Garden Service", emoji: "🌱", price: "From R180", desc: "Mowing, trimming, landscaping", bg: "rgba(30,158,90,0.12)", border: "rgba(30,158,90,0.25)" },
    ],
  },
  {
    title: "Vehicle",
    emoji: "🚗",
    services: [
      { id: "carwash", name: "Car Wash & Detail", emoji: "🚿", price: "From R80", desc: "Mobile wash at your door", bg: "rgba(14,158,194,0.12)", border: "rgba(14,158,194,0.25)" },
      { id: "mechanic", name: "Mobile Mechanic", emoji: "🔩", price: "From R400", desc: "Basic repairs, diagnostics", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)" },
      { id: "towing", name: "Tow Truck", emoji: "🚛", price: "From R500", desc: "24/7 breakdown recovery", bg: "rgba(232,80,58,0.12)", border: "rgba(232,80,58,0.25)" },
    ],
  },
  {
    title: "Personal",
    emoji: "💆",
    services: [
      { id: "massage", name: "Massage & Spa", emoji: "💆", price: "From R350", desc: "Mobile massage therapist", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)" },
      { id: "trainer", name: "Personal Trainer", emoji: "💪", price: "From R200", desc: "Beach/outdoor fitness sessions", bg: "rgba(30,158,90,0.12)", border: "rgba(30,158,90,0.25)" },
      { id: "photography", name: "Photography", emoji: "📸", price: "From R500", desc: "Events, portraits, aerial drone", bg: "rgba(14,158,194,0.12)", border: "rgba(14,158,194,0.25)" },
      { id: "tutor", name: "Tutoring", emoji: "📚", price: "From R150/hr", desc: "Maths, science, languages", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)" },
    ],
  },
  {
    title: "Delivery & Moving",
    emoji: "📦",
    services: [
      { id: "courier", name: "Same-Day Courier", emoji: "📮", price: "From R45", desc: "Send packages locally", bg: "rgba(232,80,58,0.12)", border: "rgba(232,80,58,0.25)" },
      { id: "moving", name: "Moving & Furniture", emoji: "📦", price: "From R800", desc: "Bakkie hire, removals", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)" },
    ],
  },
];

export default function ServicesPage() {
  const showToast = useToastStore((s) => s.show);

  return (
    <div>
      <div className="px-[18px] pt-3 pb-3.5">
        <div className="flex items-center gap-2.5 mb-1">
          <Link
            href="/"
            className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
          >
            ←
          </Link>
          <h1 className="font-heading font-black text-[22px] tracking-tight">
            All <span className="text-primary">Services</span>
          </h1>
        </div>
        <p className="text-xs text-t2 ml-[52px]">Book local services in the Overberg</p>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 px-[18px] mb-4">
        <div className="flex-1 bg-primary/[0.06] border border-primary/15 rounded-[16px] p-3 text-center">
          <div className="font-heading font-black text-lg text-primary">15+</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Services</div>
        </div>
        <div className="flex-1 bg-sea/[0.06] border border-sea/15 rounded-[16px] p-3 text-center">
          <div className="font-heading font-black text-lg text-sea">4.8★</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Avg Rating</div>
        </div>
        <div className="flex-1 bg-sun/[0.06] border border-sun/15 rounded-[16px] p-3 text-center">
          <div className="font-heading font-black text-lg text-sun">30min</div>
          <div className="text-[10px] text-t2 font-heading font-semibold">Avg Response</div>
        </div>
      </div>

      <div className="px-[18px] pb-24">
        {serviceCategories.map((cat) => (
          <div key={cat.title} className="mb-5">
            <h2 className="font-heading font-extrabold text-sm flex items-center gap-1.5 mb-3">
              {cat.emoji} {cat.title}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {cat.services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => showToast(`✓ ${svc.name} — booking coming soon`)}
                  className="bg-dark2 border border-bd rounded-[16px] p-3.5 text-left active:scale-[0.97] transition-transform"
                >
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl mb-2.5 border"
                    style={{ background: svc.bg, borderColor: svc.border }}
                  >
                    {svc.emoji}
                  </div>
                  <div className="font-heading font-bold text-[13px] leading-tight">{svc.name}</div>
                  <div className="text-[10px] text-t2 mt-0.5">{svc.desc}</div>
                  <div className="font-heading font-bold text-primary text-[11px] mt-1.5">{svc.price}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

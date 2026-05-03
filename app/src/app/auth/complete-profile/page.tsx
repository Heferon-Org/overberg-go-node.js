"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";

const areas = ["Struisbaai", "L'Agulhas", "Arniston", "Bredasdorp", "Elim", "Napier", "Stanford", "Hermanus"];

const roles: { value: string; label: string; emoji: string; desc: string }[] = [
  { value: "customer", label: "Customer", emoji: "🛒", desc: "Order food, rides & experiences" },
  { value: "driver", label: "Driver", emoji: "🚗", desc: "Deliver food & drive passengers" },
  { value: "vendor", label: "Vendor", emoji: "🍽️", desc: "List your restaurant or business" },
];

export default function CompleteProfilePage() {
  const [name, setName] = useState("");
  const [area, setArea] = useState("Struisbaai");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("Please enter your name");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      showToast("Session expired — please log in again");
      router.push("/auth");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: name.trim(),
      area,
      role,
      phone: user.phone || null,
    } as any);

    if (error) {
      showToast(error.message);
      setLoading(false);
      return;
    }

    // If driver or vendor, redirect to KYC
    if (role === "driver") {
      showToast("✓ Profile created — complete your KYC next");
      router.push("/driver/kyc");
    } else if (role === "vendor") {
      showToast("✓ Profile created — complete your KYC next");
      router.push("/vendor/kyc");
    } else {
      showToast("✓ Welcome to OverBerg Go!");
      router.push("/");
    }
  };

  return (
    <div className="min-h-dvh px-6 pt-12 pb-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-[20px] bg-primary/10 border border-primary/25 flex items-center justify-center text-3xl mx-auto mb-4">
          👤
        </div>
        <h1 className="font-heading font-black text-2xl">Complete Your Profile</h1>
        <p className="text-sm text-t2 mt-2">Tell us a bit about yourself</p>
      </div>

      <label className="font-heading font-bold text-xs text-t2 block mb-2">Full name</label>
      <input
        type="text"
        placeholder="Your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-dark2 border border-bd rounded-xl px-4 py-3.5 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors mb-5"
      />

      <label className="font-heading font-bold text-xs text-t2 block mb-2">Your area</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {areas.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold border transition-all ${
              area === a
                ? "bg-primary text-white border-primary"
                : "bg-dark2 border-bd2 text-t2"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <label className="font-heading font-bold text-xs text-t2 block mb-2">I want to</label>
      <div className="space-y-2 mb-8">
        {roles.map((r) => (
          <button
            key={r.value}
            onClick={() => setRole(r.value)}
            className={`w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all text-left ${
              role === r.value
                ? "bg-primary/[0.06] border-primary/30"
                : "bg-dark2 border-bd"
            }`}
          >
            <span className="text-2xl">{r.emoji}</span>
            <div>
              <div className="font-heading font-bold text-sm">{r.label}</div>
              <div className="text-[11px] text-t2">{r.desc}</div>
            </div>
            {role === r.value && (
              <span className="ml-auto text-primary font-bold">✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}

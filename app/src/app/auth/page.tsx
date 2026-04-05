"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToastStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const showToast = useToastStore((s) => s.show);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url-here";

  const handleSendOtp = async () => {
    if (phone.length < 7) {
      showToast("Enter a valid phone number");
      return;
    }

    if (!isSupabaseConfigured) {
      // Demo mode
      setOtpSent(true);
      showToast("✓ Demo mode — OTP is 1234");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const formattedPhone = phone.startsWith("+") ? phone : `+27${phone.replace(/^0/, "")}`;
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: mode === "signup" ? { data: { full_name: name } } : undefined,
    });
    setLoading(false);

    if (error) {
      showToast(error.message);
    } else {
      setOtpSent(true);
      showToast("✓ OTP sent to " + phone);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 4) {
      showToast("Enter the 4-digit code");
      return;
    }

    if (!isSupabaseConfigured) {
      // Demo mode — accept any 4-digit code
      showToast("✓ Welcome to OverBerg Go!");
      router.push(redirect);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const formattedPhone = phone.startsWith("+") ? phone : `+27${phone.replace(/^0/, "")}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      showToast(error.message);
    } else {
      showToast("✓ Welcome to OverBerg Go!");
      router.push(redirect);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    if (!isSupabaseConfigured) {
      showToast("Social login requires Supabase setup");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${redirect}` },
    });
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-4">
        <div className="w-20 h-20 rounded-[24px] bg-primary/10 border border-primary/25 flex items-center justify-center text-4xl mb-6">
          🌿
        </div>
        <h1 className="font-heading font-black text-3xl tracking-tight mb-2">OverBerg Go</h1>
        <p className="text-t2 text-sm leading-relaxed">
          Food, rides, experiences & more<br />in the Overberg region
        </p>
      </div>

      {/* Auth form */}
      <div className="bg-dark2 border-t border-bd rounded-t-3xl px-6 pt-6 pb-10">
        {/* Tabs */}
        <div className="flex bg-dark3 rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setOtpSent(false); }}
            className={`flex-1 font-heading font-bold text-sm py-2.5 rounded-xl transition-all ${
              mode === "login" ? "bg-primary text-white" : "text-t3"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => { setMode("signup"); setOtpSent(false); }}
            className={`flex-1 font-heading font-bold text-sm py-2.5 rounded-xl transition-all ${
              mode === "signup" ? "bg-primary text-white" : "text-t3"
            }`}
          >
            Sign up
          </button>
        </div>

        {!otpSent ? (
          <>
            <label className="font-heading font-bold text-xs text-t2 block mb-2">
              Mobile number
            </label>
            <div className="flex items-center gap-2 bg-dark3 border border-bd rounded-xl px-3 py-3 mb-4 focus-within:border-primary/40 transition-colors">
              <span className="text-sm text-t2 font-heading font-bold">🇿🇦 +27</span>
              <div className="w-px h-5 bg-bd2" />
              <input
                type="tel"
                placeholder="82 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent flex-1 text-white text-sm outline-none placeholder:text-t3"
              />
            </div>

            {mode === "signup" && (
              <>
                <label className="font-heading font-bold text-xs text-t2 block mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark3 border border-bd rounded-xl px-3 py-3 text-sm text-white placeholder:text-t3 outline-none focus:border-primary/40 transition-colors mb-4"
                />
              </>
            )}

            <button
              onClick={handleSendOtp}
              className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-primary-dark active:scale-[0.98] transition-all mb-4"
            >
              {loading ? "Sending..." : mode === "login" ? "Send OTP" : "Create Account"}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-bd" />
              <span className="text-xs text-t3 font-heading">or continue with</span>
              <div className="flex-1 h-px bg-bd" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSocialLogin("google")}
                className="flex-1 flex items-center justify-center gap-2 bg-dark3 border border-bd rounded-xl py-3 text-sm font-heading font-bold active:scale-[0.98] transition-transform"
              >
                <span className="text-lg">G</span> Google
              </button>
              <button
                onClick={() => handleSocialLogin("apple")}
                className="flex-1 flex items-center justify-center gap-2 bg-dark3 border border-bd rounded-xl py-3 text-sm font-heading font-bold active:scale-[0.98] transition-transform"
              >
                <span className="text-lg">🍎</span> Apple
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-t2">
                Enter the 4-digit code sent to
              </p>
              <p className="font-heading font-bold text-sm mt-1">+27 {phone}</p>
            </div>

            <div className="flex gap-3 justify-center mb-6">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  className="w-14 h-14 bg-dark3 border border-bd rounded-xl text-center text-xl font-heading font-black text-white outline-none focus:border-primary/50 transition-colors"
                  value={otp[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d?$/.test(val)) {
                      const newOtp = otp.split("");
                      newOtp[i] = val;
                      setOtp(newOtp.join(""));
                      // Auto-focus next
                      if (val && i < 3) {
                        const next = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                        next?.focus();
                      }
                    }
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-primary-dark active:scale-[0.98] transition-all mb-4"
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>

            <div className="text-center">
              <button
                onClick={() => showToast("✓ OTP resent")}
                className="text-primary font-heading font-bold text-xs"
              >
                Resend code
              </button>
              <span className="text-t3 text-xs mx-2">·</span>
              <button
                onClick={() => setOtpSent(false)}
                className="text-t2 font-heading font-bold text-xs"
              >
                Change number
              </button>
            </div>
          </>
        )}

        <p className="text-[10px] text-t3 text-center mt-6 leading-relaxed">
          By continuing, you agree to OverBerg Go&apos;s Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

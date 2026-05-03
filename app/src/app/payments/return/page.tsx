"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PaymentReturnPage() {
  return (
    <Suspense>
      <PaymentReturnInner />
    </Suspense>
  );
}

function PaymentReturnInner() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentId = params.get("payment_id");
  const [status, setStatus] = useState<"checking" | "completed" | "pending" | "failed">("checking");
  const [intent, setIntent] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (!paymentId) {
      setStatus("failed");
      return;
    }
    const supabase = createClient();
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      const { data } = await supabase
        .from("payments")
        .select("status, amount, payload")
        .eq("id", paymentId)
        .single();

      const row = data as { status: string; amount: number; payload: { intent?: string } | null } | null;
      if (cancelled || !row) return;

      setAmount(Number(row.amount));
      setIntent(row.payload?.intent || "order_payment");

      if (row.status === "completed") {
        setStatus("completed");
        return;
      }
      if (row.status === "failed" || row.status === "cancelled") {
        setStatus("failed");
        return;
      }

      attempts++;
      if (attempts < 10) {
        setTimeout(poll, 1500);
      } else {
        setStatus("pending");
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  if (status === "checking") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
        <h1 className="font-heading font-black text-xl mb-2">Confirming payment...</h1>
        <p className="text-t2 text-sm">Just a moment while we verify with PayFast.</p>
      </div>
    );
  }

  if (status === "completed") {
    const isTopUp = intent === "wallet_topup";
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/25 flex items-center justify-center text-4xl mb-6">
          ✓
        </div>
        <h1 className="font-heading font-black text-2xl mb-2">
          {isTopUp ? "Wallet Topped Up!" : "Payment Successful"}
        </h1>
        <p className="text-t2 text-sm mb-6">
          {isTopUp
            ? `R${amount.toFixed(2)} added to your GoWallet.`
            : `R${amount.toFixed(2)} paid via PayFast.`}
        </p>
        <Link
          href={isTopUp ? "/wallet" : "/orders"}
          className="w-full max-w-xs bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-primary-dark transition-colors mb-3"
        >
          {isTopUp ? "View Wallet" : "View Orders"}
        </Link>
        <button
          onClick={() => router.push("/")}
          className="font-heading font-bold text-sm text-primary"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="font-heading font-black text-xl mb-2">Payment Pending</h1>
        <p className="text-t2 text-sm mb-6">
          PayFast is still processing this transaction. We&apos;ll update your wallet automatically when it completes.
        </p>
        <Link
          href="/wallet"
          className="font-heading font-bold text-sm text-primary"
        >
          Check Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-coral/10 border-2 border-coral/25 flex items-center justify-center text-3xl mb-6">
        ✕
      </div>
      <h1 className="font-heading font-black text-2xl mb-2">Payment Failed</h1>
      <p className="text-t2 text-sm mb-6">Something went wrong. No funds were charged.</p>
      <Link
        href="/wallet"
        className="w-full max-w-xs bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-primary-dark transition-colors mb-3"
      >
        Back to Wallet
      </Link>
    </div>
  );
}

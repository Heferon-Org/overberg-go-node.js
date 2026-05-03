"use client";

import { useState } from "react";
import Link from "next/link";
import { useWalletStore, useToastStore } from "@/lib/store";
import { useOptionalAuth } from "@/lib/supabase/auth";
import { useWallet } from "@/lib/supabase/hooks";
import { PayfastRedirect } from "@/components/PayfastRedirect";

const topUpAmounts = [50, 100, 200, 500, 1000];

function isLiveSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url-here"
  );
}

export default function WalletPage() {
  const live = isLiveSupabase();
  const auth = useOptionalAuth();
  const userId = auth?.user?.id;

  // Live wallet via Supabase (no-op when userId undefined)
  const liveWallet = useWallet(userId);

  // Local fallback for demo mode
  const localWallet = useWalletStore();

  const balance = live ? liveWallet.balance : localWallet.balance;
  const transactions = live
    ? liveWallet.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        description: t.description,
        date: new Date(t.created_at).toISOString().split("T")[0],
      }))
    : localWallet.transactions;

  const showToast = useToastStore((s) => s.show);
  const [showTopUp, setShowTopUp] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirect, setRedirect] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const handleTopUp = async (amount: number) => {
    if (!live) {
      localWallet.topUp(amount);
      setShowTopUp(false);
      setCustomAmount("");
      showToast(`✓ R${amount} added to wallet`);
      return;
    }

    if (amount < 5) {
      showToast("Minimum top-up is R5");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/payfast/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          intent: "wallet_topup",
          itemName: "OverBerg Go Wallet Top-up",
          itemDescription: `Top up wallet by R${amount}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Top-up failed");
        setSubmitting(false);
        return;
      }
      setRedirect({ url: data.url, fields: data.fields });
    } catch {
      showToast("Network error");
      setSubmitting(false);
    }
  };

  const typeConfig: Record<string, { emoji: string; color: string }> = {
    topup: { emoji: "⬆️", color: "text-primary" },
    payment: { emoji: "🛒", color: "text-coral" },
    refund: { emoji: "↩️", color: "text-sea" },
    cashback: { emoji: "🎁", color: "text-sun" },
    referral: { emoji: "👥", color: "text-primary" },
    withdrawal: { emoji: "🏦", color: "text-coral" },
    adjustment: { emoji: "⚖️", color: "text-t2" },
  };

  if (redirect) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6" />
        <h1 className="font-heading font-black text-xl mb-2">Redirecting to PayFast...</h1>
        <p className="text-t2 text-sm">Please don&apos;t close this window.</p>
        <PayfastRedirect url={redirect.url} fields={redirect.fields} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <h1 className="font-heading font-black text-lg">OverBerg Wallet</h1>
      </div>

      {/* Balance card */}
      <div className="mx-[18px] bg-gradient-to-br from-primary to-primary-dark rounded-[22px] p-6 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="text-white/70 text-xs font-heading font-semibold mb-1">Available Balance</div>
          <div className="font-heading font-black text-4xl text-white mb-1">
            R{Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-white/60 text-[11px] font-heading">OverBerg Go Wallet</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 px-[18px] mb-5">
        <button
          onClick={() => setShowTopUp(true)}
          className="flex-1 bg-primary/10 border border-primary/25 rounded-[16px] p-3.5 text-center active:scale-[0.97] transition-transform"
        >
          <div className="text-xl mb-1">⬆️</div>
          <div className="font-heading font-bold text-xs text-primary">Top Up</div>
        </button>
        <button
          onClick={() => showToast("Transfer — coming soon")}
          className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center active:scale-[0.97] transition-transform"
        >
          <div className="text-xl mb-1">↗️</div>
          <div className="font-heading font-bold text-xs">Transfer</div>
        </button>
        <button
          onClick={() => showToast("Withdraw — coming soon")}
          className="flex-1 bg-dark2 border border-bd rounded-[16px] p-3.5 text-center active:scale-[0.97] transition-transform"
        >
          <div className="text-xl mb-1">🏦</div>
          <div className="font-heading font-bold text-xs">Withdraw</div>
        </button>
        <Link
          href="/promos"
          className="flex-1 bg-sun/10 border border-sun/25 rounded-[16px] p-3.5 text-center active:scale-[0.97] transition-transform"
        >
          <div className="text-xl mb-1">🎟️</div>
          <div className="font-heading font-bold text-xs text-sun">Vouchers</div>
        </Link>
      </div>

      {/* Cashback info */}
      <div className="mx-[18px] bg-primary/[0.06] border border-primary/15 rounded-[16px] p-3.5 flex items-center gap-3 mb-5">
        <span className="text-xl">💰</span>
        <div className="flex-1">
          <div className="font-heading font-bold text-[13px]">Earn 5% cashback</div>
          <div className="text-[11px] text-t2">On all wallet payments. Cashback credited instantly.</div>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-[18px] mb-3">
        <h2 className="font-heading font-extrabold text-sm">Transaction History</h2>
      </div>
      <div className="px-[18px] pb-24">
        {transactions.length === 0 ? (
          <div className="bg-dark2 border border-bd rounded-[18px] p-6 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm font-heading font-bold">No transactions yet</p>
            <p className="text-xs text-t2 mt-1">Top up your wallet to get started</p>
          </div>
        ) : (
          <div className="bg-dark2 border border-bd rounded-[18px] overflow-hidden">
            {transactions.map((tx, i) => {
              const cfg = typeConfig[tx.type] || typeConfig.payment;
              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < transactions.length - 1 ? "border-b border-bd" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-dark3 flex items-center justify-center text-lg">
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-sm">{tx.description}</div>
                    <div className="text-[10px] text-t3 mt-0.5">{tx.date}</div>
                  </div>
                  <div className={`font-heading font-black text-sm ${tx.amount >= 0 ? "text-primary" : "text-t1"}`}>
                    {tx.amount >= 0 ? "+" : ""}R{Math.abs(tx.amount).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top-up modal */}
      {showTopUp && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center"
          onClick={() => !submitting && setShowTopUp(false)}
        >
          <div
            className="bg-white border-t border-bd rounded-t-3xl w-full max-w-lg p-6 pb-10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-5" />
            <h2 className="font-heading font-black text-lg mb-1">Top Up Wallet</h2>
            <p className="text-xs text-t2 mb-4">
              {live ? "Secure top-up via PayFast" : "Demo mode — no real payment"}
            </p>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {topUpAmounts.map((amt) => (
                <button
                  key={amt}
                  disabled={submitting}
                  onClick={() => handleTopUp(amt)}
                  className="bg-dark3 border border-bd rounded-xl py-3 font-heading font-bold text-sm active:bg-primary/10 active:border-primary/30 transition-colors disabled:opacity-50"
                >
                  R{amt}
                </button>
              ))}
              <div className="bg-dark3 border border-bd rounded-xl py-1.5 px-3 flex items-center">
                <span className="text-t3 text-sm mr-1">R</span>
                <input
                  type="number"
                  placeholder="Other"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="bg-transparent w-full text-sm font-heading font-bold outline-none text-t1"
                />
              </div>
            </div>
            {customAmount && (
              <button
                disabled={submitting}
                onClick={() => handleTopUp(Number(customAmount))}
                className="w-full bg-primary text-white font-heading font-bold text-sm py-3.5 rounded-2xl active:bg-primary-dark transition-colors mb-2 disabled:opacity-50"
              >
                {submitting ? "Redirecting..." : `Top Up R${customAmount}`}
              </button>
            )}
            {live && (
              <p className="text-[10px] text-t3 text-center mt-3">
                You will be redirected to PayFast (sandbox) to complete payment.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

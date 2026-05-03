"use client";

import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-sun/10 border-2 border-sun/25 flex items-center justify-center text-3xl mb-6">
        ↩
      </div>
      <h1 className="font-heading font-black text-2xl mb-2">Payment Cancelled</h1>
      <p className="text-t2 text-sm mb-6">No funds were charged. You can try again anytime.</p>
      <Link
        href="/wallet"
        className="w-full max-w-xs bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-primary-dark transition-colors mb-3"
      >
        Back to Wallet
      </Link>
      <Link href="/" className="font-heading font-bold text-sm text-primary">
        Back to Home
      </Link>
    </div>
  );
}

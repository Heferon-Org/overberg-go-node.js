"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function PharmacyCartPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, total } = useCartStore();
  const [placing, setPlacing] = useState(false);
  const supabase = createClient();

  async function placeOrder() {
    setPlacing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || items.length === 0) { setPlacing(false); return; }

    const deliveryFee = 25;
    const serviceFee = Math.round(total() * 0.05 * 100) / 100;
    const orderTotal = total() + deliveryFee + serviceFee;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase.from("orders") as any).insert({
      customer_id: user.id,
      order_number: `PH${Date.now().toString(36).toUpperCase()}`,
      items,
      subtotal: total(),
      delivery_fee: deliveryFee,
      service_fee: serviceFee,
      total: orderTotal,
      status: "placed",
      service_type: "pharmacy",
      dispatch_status: "idle",
      payment_status: "pending",
    }).select("id").single();

    if (!error && order) {
      clearCart();
      router.push(`/orders/${order.id}`);
    }
    setPlacing(false);
  }

  if (items.length === 0) {
    return (
      <div className="px-4 pt-6 pb-24 text-center">
        <p className="text-4xl mb-3">💊</p>
        <p className="font-semibold">Your pharmacy cart is empty</p>
        <button onClick={() => router.push("/pharmacy")} className="mt-4 text-primary text-sm font-medium">
          Browse pharmacies
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <button onClick={() => router.back()} className="text-sm text-primary mb-4">&larr; Back</button>
      <h1 className="text-xl font-display font-bold mb-4">Pharmacy Cart</h1>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
            <span className="text-xl">{item.emoji}</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-t3">Qty: {item.quantity}</p>
            </div>
            <p className="font-semibold text-sm">R{(item.price * item.quantity).toFixed(2)}</p>
            <button onClick={() => removeItem(item.id)} className="text-red-500 text-xs ml-2">Remove</button>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm mb-6">
        <div className="flex justify-between"><span className="text-t3">Subtotal</span><span>R{total().toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-t3">Delivery</span><span>R25.00</span></div>
        <div className="flex justify-between"><span className="text-t3">Service fee</span><span>R{(total() * 0.05).toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-base pt-2 border-t">
          <span>Total</span>
          <span>R{(total() + 25 + total() * 0.05).toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={placeOrder}
        disabled={placing}
        className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold disabled:opacity-50"
      >
        {placing ? "Placing order..." : "Place Pharmacy Order"}
      </button>
    </div>
  );
}

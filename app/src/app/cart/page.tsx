"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore, useToastStore } from "@/lib/store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total);
  const count = useCartStore((s) => s.count);
  const showToast = useToastStore((s) => s.show);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const deliveryFee = 35;
  const serviceFee = Math.round(total() * 0.05);
  const grandTotal = total() + deliveryFee + serviceFee;

  if (orderPlaced) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="font-heading font-black text-2xl mb-2">Order Placed!</h1>
        <p className="text-t2 text-sm mb-2">
          Your order #{`OBG-${Math.floor(Math.random() * 9000 + 1000)}`} has been sent to the restaurant.
        </p>
        <p className="text-t3 text-xs mb-8">Estimated delivery: 20–30 min</p>
        <Link
          href="/orders/tracking"
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 text-center block mb-3 active:bg-primary-dark transition-colors"
        >
          Track Order
        </Link>
        <Link
          href="/"
          className="font-heading font-bold text-sm text-primary"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="font-heading font-black text-xl mb-2">Your cart is empty</h1>
        <p className="text-t2 text-sm mb-6">Add items from a restaurant to get started</p>
        <Link
          href="/food"
          className="bg-primary text-white font-heading font-bold text-sm px-8 py-3 rounded-2xl active:bg-primary-dark transition-colors"
        >
          Browse Restaurants
        </Link>
      </div>
    );
  }

  const restaurantName = items[0]?.restaurantName || "Restaurant";

  return (
    <div className="pb-40">
      {/* Header */}
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href={`/food/${items[0]?.restaurantId || ""}`}
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <div>
          <h1 className="font-heading font-black text-lg">Your Order</h1>
          <p className="text-xs text-t2">from {restaurantName}</p>
        </div>
        <button
          onClick={() => {
            clearCart();
            showToast("Cart cleared");
          }}
          className="ml-auto text-coral text-xs font-heading font-bold"
        >
          Clear all
        </button>
      </div>

      {/* Items */}
      <div className="px-[18px] mb-4">
        <div className="bg-dark2 border border-bd rounded-[18px] overflow-hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-bd last:border-b-0"
            >
              <div className="w-10 h-10 rounded-xl bg-dark3 flex items-center justify-center text-xl shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-bold text-sm">{item.name}</div>
                <div className="text-xs text-primary font-heading font-bold mt-0.5">
                  R{item.price * item.quantity}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => decrementItem(item.id)}
                  className="w-7 h-7 rounded-full bg-dark3 border border-bd flex items-center justify-center text-t2 font-bold text-sm"
                >
                  −
                </button>
                <span className="font-heading font-bold text-sm w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() =>
                    addItem({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      emoji: item.emoji,
                      restaurantId: item.restaurantId,
                      restaurantName: item.restaurantName,
                    })
                  }
                  className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add note */}
      <div className="px-[18px] mb-4">
        <div className="bg-dark2 border border-bd rounded-[18px] p-4">
          <label className="font-heading font-bold text-xs text-t2 block mb-2">Order note</label>
          <input
            type="text"
            placeholder="Any special instructions..."
            className="w-full bg-dark3 border border-bd rounded-xl px-3 py-2.5 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Delivery address */}
      <div className="px-[18px] mb-4">
        <div className="bg-dark2 border border-bd rounded-[18px] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading font-bold text-xs text-t2">Deliver to</span>
            <button className="text-primary font-heading font-bold text-xs">Change</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <span className="font-heading font-bold text-sm">Marine 127, Struisbaai</span>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="px-[18px] mb-4">
        <div className="bg-dark2 border border-bd rounded-[18px] p-4">
          <span className="font-heading font-bold text-xs text-t2 block mb-3">Payment method</span>
          <div className="space-y-2">
            {[
              { id: "card", label: "Visa ···4521", icon: "💳" },
              { id: "payfast", label: "PayFast", icon: "🏦" },
              { id: "snapscan", label: "SnapScan", icon: "📱" },
              { id: "cash", label: "Cash on delivery", icon: "💵" },
            ].map((pm) => (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  paymentMethod === pm.id
                    ? "border-primary/40 bg-primary/[0.05]"
                    : "border-bd bg-dark3"
                }`}
              >
                <span className="text-lg">{pm.icon}</span>
                <span className="font-heading font-bold text-sm">{pm.label}</span>
                {paymentMethod === pm.id && (
                  <span className="ml-auto text-primary font-bold text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price summary */}
      <div className="px-[18px] mb-6">
        <div className="bg-dark2 border border-bd rounded-[18px] p-4 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-t2">Subtotal ({count()} items)</span>
            <span className="font-heading font-bold">R{total()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-t2">Delivery fee</span>
            <span className="font-heading font-bold">R{deliveryFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-t2">Service fee</span>
            <span className="font-heading font-bold">R{serviceFee}</span>
          </div>
          <div className="border-t border-bd pt-2.5 flex justify-between">
            <span className="font-heading font-bold text-base">Total</span>
            <span className="font-heading font-black text-lg text-primary">R{grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Place order button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-bd shadow-[0_-2px_8px_rgba(0,0,0,0.06)] px-[18px] py-4 pb-8 z-40">
        <button
          onClick={() => {
            setOrderPlaced(true);
            clearCart();
          }}
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-[17px] active:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          Place Order · R{grandTotal}
        </button>
      </div>
    </div>
  );
}

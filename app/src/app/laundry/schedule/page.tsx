"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LaundryItem = { type: string; qty: number; price: number };

const LAUNDRY_SERVICES = [
  { type: "Wash & Fold", emoji: "👕", price: 15, unit: "per kg" },
  { type: "Wash & Iron", emoji: "👔", price: 25, unit: "per kg" },
  { type: "Dry Clean", emoji: "🧥", price: 65, unit: "per item" },
  { type: "Ironing Only", emoji: "🧹", price: 12, unit: "per item" },
  { type: "Bedding", emoji: "🛏️", price: 45, unit: "per set" },
  { type: "Curtains", emoji: "🪟", price: 80, unit: "per pair" },
];

export default function LaundrySchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const merchantId = searchParams.get("merchant");
  const supabase = createClient();

  const [items, setItems] = useState<LaundryItem[]>([]);
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  function addItem(type: string, price: number) {
    setItems((prev) => {
      const existing = prev.find((i) => i.type === type);
      if (existing) return prev.map((i) => i.type === type ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { type, qty: 1, price }];
    });
  }

  function removeItem(type: string) {
    setItems((prev) => {
      const existing = prev.find((i) => i.type === type);
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter((i) => i.type !== type);
      return prev.map((i) => i.type === type ? { ...i, qty: i.qty - 1 } : i);
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const pickupFee = 30;
  const returnFee = 30;
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + pickupFee + returnFee + serviceFee;

  async function placeOrder() {
    if (items.length === 0 || !pickupAddress || !pickupDate) return;
    setPlacing(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPlacing(false); return; }

    const scheduledFor = new Date(`${pickupDate}T${pickupTime}:00`).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase.from("orders") as any).insert({
      customer_id: user.id,
      restaurant_id: merchantId || undefined,
      order_number: `LN${Date.now().toString(36).toUpperCase()}`,
      items: items.map((i) => ({
        id: i.type.toLowerCase().replace(/\s+/g, "_"),
        name: i.type,
        price: i.price,
        quantity: i.qty,
        emoji: LAUNDRY_SERVICES.find((s) => s.type === i.type)?.emoji || "👔",
      })),
      subtotal,
      delivery_fee: pickupFee + returnFee,
      service_fee: serviceFee,
      total,
      status: "placed",
      service_type: "laundry",
      service_payload: {
        pickup_address: pickupAddress,
        pickup_notes: notes,
        laundry_items: items,
        pickup_driver_id: null,
        dropoff_driver_id: null,
        pickup_completed: false,
        return_completed: false,
      },
      scheduled_for: scheduledFor,
      dispatch_status: "idle",
      payment_status: "pending",
    }).select("id").single();

    if (!error && order) {
      router.push(`/orders/${(order as { id: string }).id}`);
    }
    setPlacing(false);
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="px-4 pt-6 pb-24">
      <button onClick={() => router.back()} className="text-sm text-primary mb-4">&larr; Back</button>
      <h1 className="text-2xl font-display font-bold mb-1">Schedule Laundry Pickup</h1>
      <p className="text-sm text-t3 mb-6">We pick up, wash, and deliver back to you</p>

      <div className="mb-6">
        <h2 className="font-semibold text-sm mb-3">Select Services</h2>
        <div className="space-y-2">
          {LAUNDRY_SERVICES.map((s) => {
            const item = items.find((i) => i.type === s.type);
            return (
              <div key={s.type} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
                <span className="text-xl">{s.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.type}</p>
                  <p className="text-xs text-t3">R{s.price} {s.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item && (
                    <>
                      <button onClick={() => removeItem(s.type)} className="w-7 h-7 rounded-full bg-gray-100 text-sm font-bold">-</button>
                      <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                    </>
                  )}
                  <button onClick={() => addItem(s.type, s.price)} className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold">+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium mb-1 block">Pickup Address</label>
          <input
            type="text"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder="e.g. 12 Main Road, Hermanus"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Pickup Date</label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={minDate}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Pickup Time</label>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
            >
              {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm resize-none"
          />
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm mb-6">
          {items.map((i) => (
            <div key={i.type} className="flex justify-between">
              <span className="text-t3">{i.type} x{i.qty}</span>
              <span>R{(i.price * i.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between"><span className="text-t3">Pickup fee</span><span>R{pickupFee}.00</span></div>
          <div className="flex justify-between"><span className="text-t3">Return delivery</span><span>R{returnFee}.00</span></div>
          <div className="flex justify-between"><span className="text-t3">Service fee</span><span>R{serviceFee.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Total</span><span>R{total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        onClick={placeOrder}
        disabled={placing || items.length === 0 || !pickupAddress || !pickupDate}
        className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold disabled:opacity-50"
      >
        {placing ? "Scheduling..." : "Schedule Pickup"}
      </button>
    </div>
  );
}

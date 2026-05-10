"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ParcelSize = "small" | "medium" | "large";

const PARCEL_SIZES: { value: ParcelSize; label: string; desc: string; basePrice: number }[] = [
  { value: "small", label: "Small", desc: "Envelope or small box (up to 5kg)", basePrice: 45 },
  { value: "medium", label: "Medium", desc: "Standard box (5-15kg)", basePrice: 75 },
  { value: "large", label: "Large", desc: "Large item (15-30kg)", basePrice: 120 },
];

export default function NewParcelPage() {
  const router = useRouter();
  const supabase = createClient();
  const [size, setSize] = useState<ParcelSize>("small");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");
  const [dropoffNotes, setDropoffNotes] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [placing, setPlacing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!pickupAddress || !dropoffAddress) { setEstimatedFare(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const base = PARCEL_SIZES.find((s) => s.value === size)!.basePrice;
      const distanceSurcharge = Math.floor(Math.random() * 40) + 10;
      setEstimatedFare(base + distanceSurcharge);
    }, 500);
  }, [pickupAddress, dropoffAddress, size]);

  async function placeParcelOrder() {
    if (!pickupAddress || !dropoffAddress || !recipientName || !recipientPhone) return;
    setPlacing(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPlacing(false); return; }

    const fare = estimatedFare || PARCEL_SIZES.find((s) => s.value === size)!.basePrice;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase.from("orders") as any).insert({
      customer_id: user.id,
      order_number: `PL${Date.now().toString(36).toUpperCase()}`,
      items: [{ id: "parcel", name: `Parcel (${size})`, price: fare, quantity: 1, emoji: "📦" }],
      subtotal: fare,
      delivery_fee: 0,
      service_fee: Math.round(fare * 0.1),
      total: fare + Math.round(fare * 0.1),
      status: "placed",
      service_type: "parcel",
      service_payload: {
        size,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        pickup_notes: pickupNotes,
        dropoff_notes: dropoffNotes,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
      },
      dispatch_status: "idle",
      payment_status: "pending",
    }).select("id").single();

    if (!error && order) {
      router.push(`/parcels/${(order as { id: string }).id}`);
    }
    setPlacing(false);
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-2xl font-display font-bold mb-1">Send a Parcel</h1>
      <p className="text-sm text-t3 mb-6">Same-day delivery across the Overberg</p>

      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Parcel Size</label>
        <div className="grid grid-cols-3 gap-2">
          {PARCEL_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSize(s.value)}
              className={`p-3 rounded-xl text-center border-2 transition-colors ${
                size === s.value ? "border-primary bg-primary/5" : "border-gray-100"
              }`}
            >
              <p className="text-2xl mb-1">{s.value === "small" ? "📨" : s.value === "medium" ? "📦" : "🗃️"}</p>
              <p className="text-sm font-semibold">{s.label}</p>
              <p className="text-xs text-t3 mt-0.5">From R{s.basePrice}</p>
            </button>
          ))}
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
          <input
            type="text"
            value={pickupNotes}
            onChange={(e) => setPickupNotes(e.target.value)}
            placeholder="Pickup notes (optional)"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-xs mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Dropoff Address</label>
          <input
            type="text"
            value={dropoffAddress}
            onChange={(e) => setDropoffAddress(e.target.value)}
            placeholder="e.g. 5 Church Street, Bredasdorp"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
          />
          <input
            type="text"
            value={dropoffNotes}
            onChange={(e) => setDropoffNotes(e.target.value)}
            placeholder="Dropoff notes (optional)"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-xs mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Recipient</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Recipient name"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm mb-2"
          />
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="Recipient phone (e.g. 082 123 4567)"
            className="w-full px-4 py-3 rounded-xl bg-gray-100 text-sm"
          />
        </div>
      </div>

      {estimatedFare && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-t3">Delivery ({size})</span>
            <span>R{estimatedFare.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-t3">Service fee</span>
            <span>R{(estimatedFare * 0.1).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Total</span>
            <span>R{(estimatedFare + estimatedFare * 0.1).toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        onClick={placeParcelOrder}
        disabled={placing || !pickupAddress || !dropoffAddress || !recipientName || !recipientPhone}
        className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold disabled:opacity-50"
      >
        {placing ? "Placing order..." : "Send Parcel"}
      </button>
    </div>
  );
}

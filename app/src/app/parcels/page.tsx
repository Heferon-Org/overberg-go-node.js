"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ParcelOrder = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  service_payload: { dropoff_address: string; recipient_name: string; size: string };
  created_at: string;
};

export default function ParcelsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState<ParcelOrder[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total, service_payload, created_at")
        .eq("customer_id", user.id)
        .eq("service_type", "parcel")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setOrders(data as ParcelOrder[]);
    })();
  }, [supabase]);

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-bold">Parcels</h1>
        <button
          onClick={() => router.push("/parcels/new")}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
        >
          + Send Parcel
        </button>
      </div>
      <p className="text-sm text-t3 mb-6">Same-day delivery across the Overberg</p>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-t3">
          <p className="text-4xl mb-2">📦</p>
          <p className="font-medium">No parcels sent yet</p>
          <button onClick={() => router.push("/parcels/new")} className="mt-3 text-primary text-sm font-medium">
            Send your first parcel
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/parcels/${o.id}`}
              className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">#{o.order_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  o.status === "delivered" ? "bg-green-100 text-green-700" :
                  o.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {o.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-t3">{o.service_payload.recipient_name} — {o.service_payload.dropoff_address}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-t3">
                <span>{o.service_payload.size} parcel</span>
                <span className="font-semibold text-sm text-t1">R{o.total.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

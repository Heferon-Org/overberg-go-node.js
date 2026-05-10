"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ParcelOrder = {
  id: string;
  order_number: string;
  status: string;
  service_payload: {
    size: string;
    pickup_address: string;
    dropoff_address: string;
    recipient_name: string;
    recipient_phone: string;
    proof_of_delivery_url?: string;
  };
  total: number;
  created_at: string;
};

const STATUS_STEPS = ["placed", "confirmed", "picked_up", "on_the_way", "delivered"];

export default function ParcelTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const supabase = createClient();
  const [order, setOrder] = useState<ParcelOrder | null>(null);

  useEffect(() => {
    supabase
      .from("orders")
      .select("id, order_number, status, service_payload, total, created_at")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data as ParcelOrder);
      });

    const channel = supabase
      .channel(`parcel-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, ...payload.new } as ParcelOrder : null);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  if (!order) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-display font-bold mb-1">Parcel #{order.order_number}</h1>
      <p className="text-sm text-t3 mb-6">
        {new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="space-y-4">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= currentStep ? "bg-primary text-white" : "bg-gray-100 text-t3"
              }`}>
                {i <= currentStep ? "✓" : i + 1}
              </div>
              <div>
                <p className={`text-sm font-medium capitalize ${i <= currentStep ? "text-primary" : "text-t3"}`}>
                  {step.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
        <div>
          <p className="text-xs text-t3">Pickup</p>
          <p className="text-sm font-medium">{order.service_payload.pickup_address}</p>
        </div>
        <div>
          <p className="text-xs text-t3">Dropoff</p>
          <p className="text-sm font-medium">{order.service_payload.dropoff_address}</p>
        </div>
        <div>
          <p className="text-xs text-t3">Recipient</p>
          <p className="text-sm font-medium">{order.service_payload.recipient_name} ({order.service_payload.recipient_phone})</p>
        </div>
        <div>
          <p className="text-xs text-t3">Size</p>
          <p className="text-sm font-medium capitalize">{order.service_payload.size}</p>
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm font-bold">Total: R{order.total.toFixed(2)}</p>
        </div>
      </div>

      {order.service_payload.proof_of_delivery_url && (
        <div className="bg-green-50 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">Proof of Delivery</p>
          <img
            src={order.service_payload.proof_of_delivery_url}
            alt="Proof of delivery"
            className="w-full rounded-xl"
          />
        </div>
      )}
    </div>
  );
}

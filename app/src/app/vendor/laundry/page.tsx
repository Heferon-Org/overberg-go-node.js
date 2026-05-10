"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type LaundryOrder = {
  id: string;
  order_number: string;
  status: string;
  items: { name: string; quantity: number }[];
  total: number;
  service_payload: {
    pickup_address: string;
    pickup_completed: boolean;
    return_completed: boolean;
  };
  scheduled_for: string | null;
  created_at: string;
};

export default function VendorLaundryPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [tab, setTab] = useState<"active" | "completed">("active");

  const loadOrders = useCallback(async () => {
    const query = supabase
      .from("orders")
      .select("id, order_number, status, items, total, service_payload, scheduled_for, created_at")
      .eq("service_type", "laundry")
      .order("created_at", { ascending: false })
      .limit(50);

    if (tab === "active") {
      query.not("status", "in", '("delivered","cancelled")');
    } else {
      query.in("status", ["delivered", "cancelled"]);
    }

    const { data } = await query;
    if (data) setOrders(data as LaundryOrder[]);
  }, [supabase, tab]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(orderId: string, status: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("orders") as any).update({ status }).eq("id", orderId);
    loadOrders();
  }

  async function markPickupComplete(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("orders") as any).update({
      service_payload: { ...order.service_payload, pickup_completed: true },
      status: "preparing",
    }).eq("id", orderId);
    loadOrders();
  }

  async function markReturnComplete(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("orders") as any).update({
      service_payload: { ...order.service_payload, return_completed: true },
      status: "delivered",
    }).eq("id", orderId);
    loadOrders();
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-display font-bold mb-4">Laundry Queue</h1>

      <div className="flex gap-2 mb-4">
        {(["active", "completed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-gray-100 text-t3"
            }`}
          >
            {t === "active" ? "Active" : "Completed"}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-t3 py-8">No {tab} orders</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">#{order.order_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  order.status === "delivered" ? "bg-green-100 text-green-700" :
                  order.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>

              <p className="text-xs text-t3 mb-1">{order.service_payload.pickup_address}</p>
              {order.scheduled_for && (
                <p className="text-xs text-primary mb-2">
                  Scheduled: {new Date(order.scheduled_for).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}

              <div className="text-xs text-t3 mb-2">
                {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}
              </div>

              <p className="text-sm font-bold">R{order.total.toFixed(2)}</p>

              {tab === "active" && (
                <div className="flex gap-2 mt-3">
                  {order.status === "placed" && (
                    <button onClick={() => updateStatus(order.id, "confirmed")} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
                      Confirm
                    </button>
                  )}
                  {order.status === "confirmed" && !order.service_payload.pickup_completed && (
                    <button onClick={() => markPickupComplete(order.id)} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold">
                      Mark Pickup Complete
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button onClick={() => updateStatus(order.id, "ready")} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold">
                      Ready for Return
                    </button>
                  )}
                  {order.status === "ready" && (
                    <button onClick={() => markReturnComplete(order.id)} className="flex-1 py-2 bg-green-700 text-white rounded-xl text-xs font-semibold">
                      Mark Returned
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

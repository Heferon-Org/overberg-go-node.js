"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useOptionalAuth } from "@/lib/supabase/auth";
import { useVendorOrders, transitionOrder } from "@/lib/supabase/hooks";
import { useToastStore } from "@/lib/store";
import type { Order, OrderItem, OrderStatus } from "@/lib/supabase/types";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function nextActions(status: OrderStatus): { label: string; next: OrderStatus; tone: "primary" | "sun" | "coral" }[] {
  switch (status) {
    case "placed":
      return [
        { label: "Confirm", next: "confirmed", tone: "primary" },
        { label: "Decline", next: "cancelled", tone: "coral" },
      ];
    case "confirmed":
      return [{ label: "Start cooking", next: "preparing", tone: "primary" }];
    case "preparing":
      return [{ label: "Mark Ready", next: "ready", tone: "sun" }];
    default:
      return [];
  }
}

function statusBadge(status: OrderStatus) {
  switch (status) {
    case "placed": return { label: "New", color: "bg-sun/10 text-sun border-sun/25" };
    case "confirmed": return { label: "Confirmed", color: "bg-sea/10 text-sea border-sea/25" };
    case "preparing": return { label: "Preparing", color: "bg-sea/10 text-sea border-sea/25" };
    case "ready": return { label: "Ready · Awaiting rider", color: "bg-sun/10 text-sun border-sun/25" };
    case "picked_up": return { label: "Picked up", color: "bg-primary/10 text-primary border-primary/25" };
    case "on_the_way": return { label: "On the way", color: "bg-primary/10 text-primary border-primary/25" };
    case "delivered": return { label: "Delivered", color: "bg-primary/15 text-primary border-primary/30" };
    case "cancelled": return { label: "Cancelled", color: "bg-coral/10 text-coral border-coral/25" };
  }
}

export default function VendorOrdersPage() {
  const auth = useOptionalAuth();
  const userId = auth?.user?.id;
  const showToast = useToastStore((s) => s.show);
  const [restaurantId, setRestaurantId] = useState<string | undefined>();
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!userId) {
      setResolving(false);
      return;
    }
    getClient()
      .from("restaurants")
      .select("id, name")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const row = data as { id: string; name: string } | null;
        if (row) {
          setRestaurantId(row.id);
          setRestaurantName(row.name);
        }
        setResolving(false);
      });
  }, [userId]);

  const { orders, loading } = useVendorOrders(restaurantId);

  const handleAction = async (orderId: string, next: OrderStatus, label: string) => {
    const res = await transitionOrder(orderId, next);
    if (res.ok) showToast(`✓ ${label}`);
    else showToast(res.error || "Failed");
  };

  if (!userId && !resolving) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-center px-8">
        <div>
          <div className="text-3xl mb-3">🔒</div>
          <div className="font-heading font-bold text-sm mb-2">Sign in as a vendor to manage orders</div>
          <Link href="/auth" className="text-primary font-heading font-bold text-xs">Sign in →</Link>
        </div>
      </div>
    );
  }

  if (resolving || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">📋</div>
          <div className="font-heading font-bold text-sm text-t2">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="px-[18px] py-12 text-center">
        <div className="text-3xl mb-3">🏪</div>
        <div className="font-heading font-bold text-sm mb-2">No restaurant linked</div>
        <div className="text-xs text-t2 mb-4">Your account is not the owner of any restaurant in our system.</div>
        <Link href="/vendor/kyc" className="text-primary font-heading font-bold text-xs">Complete vendor onboarding →</Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link href="/vendor" className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0">←</Link>
        <div>
          <h1 className="font-heading font-black text-lg">Live Orders</h1>
          <p className="text-xs text-t2">{restaurantName}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-primary/10 border border-primary/25 rounded-full px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-live" />
          <span className="font-heading font-bold text-[10px] text-primary">Live</span>
        </div>
      </div>

      <div className="px-[18px] mb-3">
        <div className="font-heading font-bold text-sm text-t2">{orders.length} active orders</div>
      </div>

      {orders.length === 0 ? (
        <div className="px-[18px] py-12 text-center">
          <div className="text-3xl mb-3">📭</div>
          <div className="font-heading font-bold text-sm">No live orders</div>
          <div className="text-xs text-t2 mt-1">New orders will appear here automatically</div>
        </div>
      ) : (
        <div className="space-y-3 px-[18px]">
          {orders.map((o: Order) => {
            const badge = statusBadge(o.status);
            const actions = nextActions(o.status);
            const items = (o.items || []) as OrderItem[];
            const isNew = o.status === "placed";

            return (
              <div
                key={o.id}
                className={`bg-dark2 border rounded-[18px] p-4 ${isNew ? "border-sun/30 border-2" : "border-bd"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-heading font-bold text-sm">#{o.order_number}</div>
                    <div className="text-[11px] text-t2 mt-0.5">
                      Delivery · {o.delivery_address || "Customer pickup"}
                    </div>
                  </div>
                  <div className={`${badge.color} font-heading font-bold text-[11px] px-2.5 py-1 rounded-full border`}>
                    {badge.label}
                  </div>
                </div>

                <div className="space-y-2 border-t border-bd pt-3 mb-3">
                  {items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-dark3 rounded-lg flex items-center justify-center font-heading font-bold text-[10px]">
                          {item.quantity}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-t2">R{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2.5 border-t border-bd">
                    <span className="font-heading font-bold text-[13px] text-t2">Total</span>
                    <span className="font-heading font-black text-base">R{o.total}</span>
                  </div>
                </div>

                {actions.length > 0 && (
                  <div className="flex gap-2.5">
                    {actions.map((a) => (
                      <button
                        key={a.next}
                        onClick={() => handleAction(o.id, a.next, a.label)}
                        className={`flex-1 font-heading font-bold text-sm py-3 rounded-2xl active:scale-[0.98] transition-all ${
                          a.tone === "primary"
                            ? "bg-primary text-white active:bg-primary-dark"
                            : a.tone === "sun"
                            ? "bg-sun/15 border border-sun/30 text-sun"
                            : "bg-dark3 border border-bd text-coral"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

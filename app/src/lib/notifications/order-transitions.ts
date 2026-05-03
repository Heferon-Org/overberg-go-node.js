/**
 * Phase 6 notification stub.
 *
 * Phase 7 will plug in real FCM push, Twilio SMS, and Brevo email.
 * For now, writes a row to the `notifications` table (visible to the user
 * in /notifications) and logs to console.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

import type { OrderStatus } from "@/lib/supabase/types";

interface TransitionPayload {
  orderId: string;
  customerId: string;
  driverId: string | null;
  restaurantId: string;
  orderNumber: string;
  newStatus: OrderStatus;
  oldStatus: OrderStatus;
  deliveryCode: string | null;
}

const STATUS_COPY: Record<OrderStatus, { title: string; emoji: string; body: (orderNumber: string) => string }> = {
  placed: { title: "Order placed", emoji: "📋", body: (n) => `Order ${n} is awaiting confirmation` },
  confirmed: { title: "Order confirmed", emoji: "✅", body: (n) => `Order ${n} confirmed by the restaurant` },
  preparing: { title: "Cooking now", emoji: "🍳", body: (n) => `Order ${n} is being prepared` },
  ready: { title: "Ready for pickup", emoji: "📦", body: (n) => `Order ${n} is ready — driver on the way` },
  picked_up: { title: "Driver collected", emoji: "🛵", body: (n) => `Driver picked up order ${n}` },
  on_the_way: { title: "On the way", emoji: "🚀", body: (n) => `Order ${n} is on the way` },
  delivered: { title: "Delivered", emoji: "🏠", body: (n) => `Order ${n} delivered. Enjoy!` },
  cancelled: { title: "Order cancelled", emoji: "❌", body: (n) => `Order ${n} was cancelled` },
};

export async function notifyOrderTransition(admin: AdminClient, p: TransitionPayload) {
  const copy = STATUS_COPY[p.newStatus];
  if (!copy) return;

  const customerBody =
    p.newStatus === "picked_up" && p.deliveryCode
      ? `Driver arriving with code ${p.deliveryCode}`
      : copy.body(p.orderNumber);

  const recipients: { user_id: string; type: "order" }[] = [
    { user_id: p.customerId, type: "order" },
  ];
  if (p.driverId && (p.newStatus === "ready" || p.newStatus === "picked_up" || p.newStatus === "on_the_way")) {
    recipients.push({ user_id: p.driverId, type: "order" });
  }

  for (const r of recipients) {
    await admin.from("notifications").insert({
      user_id: r.user_id,
      type: r.type,
      title: copy.title,
      message: r.user_id === p.customerId ? customerBody : copy.body(p.orderNumber),
      emoji: copy.emoji,
      data: { order_id: p.orderId, status: p.newStatus, order_number: p.orderNumber },
    });
  }

  // TODO Phase 7: FCM push + Twilio SMS + Brevo email here
  console.log("[notify] order transition", {
    order: p.orderNumber,
    transition: `${p.oldStatus} → ${p.newStatus}`,
    customer: p.customerId,
    driver: p.driverId,
  });
}

/**
 * Order transition notifications — sends across all channels.
 * Inserts in-app notification + FCM push + Twilio SMS + Brevo email.
 * Each channel gracefully degrades if credentials are missing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

import type { OrderStatus } from "@/lib/supabase/types";
import { notify } from "./index";
import { getOrderTemplate, getDriverAssignedTemplate } from "./templates";

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

const CRITICAL_SMS_STATUSES: OrderStatus[] = ["picked_up", "on_the_way", "delivered", "cancelled"];

export async function notifyOrderTransition(admin: AdminClient, p: TransitionPayload) {
  const vars: Record<string, string> = {
    orderNumber: p.orderNumber,
    deliveryCode: p.deliveryCode || "",
    orderId: p.orderId,
  };

  const template = getOrderTemplate(p.newStatus, vars);

  const customerChannels: ("push" | "sms" | "email")[] = ["push"];
  if (CRITICAL_SMS_STATUSES.includes(p.newStatus)) customerChannels.push("sms");
  if (p.newStatus === "confirmed" || p.newStatus === "delivered" || p.newStatus === "cancelled") {
    customerChannels.push("email");
  }

  await notify(admin, {
    userId: p.customerId,
    template,
    channels: customerChannels,
    data: { order_id: p.orderId, status: p.newStatus, order_number: p.orderNumber },
  });

  if (p.driverId && (p.newStatus === "ready" || p.newStatus === "confirmed")) {
    const driverTemplate = getDriverAssignedTemplate(vars);
    await notify(admin, {
      userId: p.driverId,
      template: driverTemplate,
      channels: ["push", "sms"],
      data: { order_id: p.orderId, status: p.newStatus, order_number: p.orderNumber },
    });
  }

  console.log("[notify] order transition", {
    order: p.orderNumber,
    transition: `${p.oldStatus} → ${p.newStatus}`,
    customer: p.customerId,
    driver: p.driverId,
    channels: customerChannels,
  });
}

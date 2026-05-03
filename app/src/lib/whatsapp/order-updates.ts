/**
 * Send order status updates via WhatsApp.
 * Called from the order transition flow alongside SMS/push/email.
 */

import { sendWhatsAppMessage } from "./client";
import type { OrderStatus } from "@/lib/supabase/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

const STATUS_MESSAGES: Record<OrderStatus, (vars: Record<string, string>) => string> = {
  placed: (v) => `📋 Order ${v.orderNumber} received! We're sending it to the restaurant now.`,
  confirmed: (v) => `✅ Order ${v.orderNumber} confirmed! The kitchen is prepping your food.`,
  preparing: (v) => `🍳 Your order ${v.orderNumber} is being prepared. Won't be long!`,
  ready: (v) => `📦 Order ${v.orderNumber} is ready! A driver is being assigned.`,
  picked_up: (v) => v.deliveryCode
    ? `🛵 Driver has picked up your order ${v.orderNumber}!\n\n🔑 Delivery code: *${v.deliveryCode}*\nShow this to your driver.`
    : `🛵 Driver has collected your order ${v.orderNumber}!`,
  on_the_way: (v) => v.driverName
    ? `🚀 ${v.driverName} is on the way with order ${v.orderNumber}! ETA coming soon.`
    : `🚀 Your order ${v.orderNumber} is on the way!`,
  delivered: (v) => `🎉 Order ${v.orderNumber} delivered! Enjoy your meal.\n\nRate your experience: https://overberg-go.vercel.app/orders`,
  cancelled: (v) => `❌ Order ${v.orderNumber} has been cancelled. If you were charged, a refund will be processed.`,
};

interface NotifyWhatsAppPayload {
  customerId: string;
  driverId: string | null;
  orderNumber: string;
  newStatus: OrderStatus;
  deliveryCode: string | null;
  driverName?: string;
}

export async function notifyOrderViaWhatsApp(
  admin: AdminClient,
  p: NotifyWhatsAppPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.META_WHATSAPP_TOKEN) {
    return { ok: false, error: "no_credentials" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", p.customerId)
    .single();

  const phone = (profile as { phone?: string } | null)?.phone;
  if (!phone) {
    return { ok: false, error: "no_phone" };
  }

  const messageFn = STATUS_MESSAGES[p.newStatus];
  if (!messageFn) return { ok: false, error: "unknown_status" };

  const message = messageFn({
    orderNumber: p.orderNumber,
    deliveryCode: p.deliveryCode || "",
    driverName: p.driverName || "",
  });

  return sendWhatsAppMessage(phone, message);
}

export async function notifyDriverAssignmentViaWhatsApp(
  admin: AdminClient,
  customerId: string,
  orderNumber: string,
  driverName: string,
  eta?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.META_WHATSAPP_TOKEN) {
    return { ok: false, error: "no_credentials" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", customerId)
    .single();

  const phone = (profile as { phone?: string } | null)?.phone;
  if (!phone) return { ok: false, error: "no_phone" };

  const message = `🛵 Great news! *${driverName}* has been assigned to deliver your order ${orderNumber}.${eta ? `\n⏱️ Estimated arrival: ${eta}` : ""}\n\nTrack live: https://overberg-go.vercel.app/orders`;

  return sendWhatsAppMessage(phone, message);
}

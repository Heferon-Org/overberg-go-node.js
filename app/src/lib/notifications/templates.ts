import type { OrderStatus } from "@/lib/supabase/types";

export interface NotificationTemplate {
  title: string;
  body: string;
  emoji: string;
  sms?: string;
  emailSubject?: string;
  emailHtml?: string;
}

type TemplateGenerator = (vars: Record<string, string>) => NotificationTemplate;

const ORDER_TEMPLATES: Record<OrderStatus, TemplateGenerator> = {
  placed: (v) => ({
    title: "Order placed",
    body: `Order ${v.orderNumber} is awaiting confirmation`,
    emoji: "📋",
    sms: `OverBerg Go: Order ${v.orderNumber} placed. We'll confirm shortly.`,
    emailSubject: `Order ${v.orderNumber} received`,
    emailHtml: orderEmailBlock(v.orderNumber, "Your order has been placed", "We're sending it to the restaurant now. You'll get a notification once they confirm.", "#1E9E5A"),
  }),
  confirmed: (v) => ({
    title: "Order confirmed",
    body: `Order ${v.orderNumber} confirmed by the restaurant`,
    emoji: "✅",
    sms: `OverBerg Go: Order ${v.orderNumber} confirmed! Prep has started.`,
    emailSubject: `Order ${v.orderNumber} confirmed`,
    emailHtml: orderEmailBlock(v.orderNumber, "Order confirmed!", "The restaurant is getting ready to prepare your food.", "#1E9E5A"),
  }),
  preparing: (v) => ({
    title: "Cooking now",
    body: `Order ${v.orderNumber} is being prepared`,
    emoji: "🍳",
    sms: `OverBerg Go: ${v.orderNumber} is being prepared 🍳`,
    emailSubject: `Order ${v.orderNumber} is being prepared`,
    emailHtml: orderEmailBlock(v.orderNumber, "Your food is being prepared", "The kitchen is working on your order now.", "#0E9EC2"),
  }),
  ready: (v) => ({
    title: "Ready for pickup",
    body: `Order ${v.orderNumber} is ready — driver on the way`,
    emoji: "📦",
    sms: `OverBerg Go: ${v.orderNumber} ready! Driver collecting soon.`,
    emailSubject: `Order ${v.orderNumber} ready for pickup`,
    emailHtml: orderEmailBlock(v.orderNumber, "Your order is ready!", "A driver will collect it shortly.", "#F5A623"),
  }),
  picked_up: (v) => ({
    title: "Driver collected",
    body: v.deliveryCode
      ? `Driver arriving with code ${v.deliveryCode}`
      : `Driver picked up order ${v.orderNumber}`,
    emoji: "🛵",
    sms: v.deliveryCode
      ? `OverBerg Go: Driver has your order ${v.orderNumber}. Delivery code: ${v.deliveryCode}`
      : `OverBerg Go: Driver collected ${v.orderNumber}. On the way!`,
    emailSubject: `Order ${v.orderNumber} picked up`,
    emailHtml: orderEmailBlock(
      v.orderNumber,
      "Your order has been picked up",
      v.deliveryCode
        ? `Your delivery code is <strong style="font-size:28px;letter-spacing:0.15em;color:#1E9E5A">${v.deliveryCode}</strong>. Show this to the driver.`
        : "The driver is heading your way.",
      "#1E9E5A"
    ),
  }),
  on_the_way: (v) => ({
    title: "On the way",
    body: `Order ${v.orderNumber} is on the way`,
    emoji: "🚀",
    sms: `OverBerg Go: ${v.orderNumber} is on the way! 🛵`,
    emailSubject: `Order ${v.orderNumber} is on the way`,
    emailHtml: orderEmailBlock(v.orderNumber, "Your order is on the way!", "Track your delivery in the app.", "#1E9E5A"),
  }),
  delivered: (v) => ({
    title: "Delivered",
    body: `Order ${v.orderNumber} delivered. Enjoy!`,
    emoji: "🏠",
    sms: `OverBerg Go: ${v.orderNumber} delivered! Enjoy your meal 🎉`,
    emailSubject: `Order ${v.orderNumber} delivered`,
    emailHtml: orderEmailBlock(v.orderNumber, "Order delivered!", "Enjoy your meal! Rate your experience in the app.", "#1E9E5A"),
  }),
  cancelled: (v) => ({
    title: "Order cancelled",
    body: `Order ${v.orderNumber} was cancelled`,
    emoji: "❌",
    sms: `OverBerg Go: Order ${v.orderNumber} has been cancelled.`,
    emailSubject: `Order ${v.orderNumber} cancelled`,
    emailHtml: orderEmailBlock(v.orderNumber, "Order cancelled", "Your order has been cancelled. If you were charged, a refund will be processed.", "#E8503A"),
  }),
};

export function getOrderTemplate(status: OrderStatus, vars: Record<string, string>): NotificationTemplate {
  return ORDER_TEMPLATES[status](vars);
}

export function getDriverAssignedTemplate(vars: Record<string, string>): NotificationTemplate {
  return {
    title: "New trip assigned",
    body: `Order ${vars.orderNumber} — navigate to pickup`,
    emoji: "🛵",
    sms: `OverBerg Go Driver: New trip ${vars.orderNumber}. Open app to navigate.`,
  };
}

export function getWelcomeTemplate(vars: Record<string, string>): NotificationTemplate {
  return {
    title: "Welcome to OverBerg Go!",
    body: "Your local Overberg super app is ready",
    emoji: "👋",
    emailSubject: "Welcome to OverBerg Go! 🌊",
    emailHtml: `
      <div style="font-family:'Inter',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:48px;">🌊</span>
        </div>
        <h1 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:900;text-align:center;color:#111827;margin-bottom:16px;">
          Welcome to OverBerg Go, ${vars.name || "there"}!
        </h1>
        <p style="color:rgba(17,24,39,0.65);font-size:15px;line-height:1.6;text-align:center;margin-bottom:24px;">
          Food delivery, rides, groceries, experiences — all in one app for the Overberg.
        </p>
        <div style="text-align:center;">
          <a href="https://overberg-go.vercel.app" style="display:inline-block;background:#1E9E5A;color:white;font-weight:700;padding:14px 32px;border-radius:14px;text-decoration:none;font-size:15px;">
            Start Exploring
          </a>
        </div>
        ${emailFooter()}
      </div>
    `,
  };
}

export function getWeeklyStatementTemplate(vars: Record<string, string>): NotificationTemplate {
  return {
    title: "Weekly earnings statement",
    body: `You earned ${vars.total} this week`,
    emoji: "💰",
    emailSubject: `Your OverBerg Go earnings — ${vars.week}`,
    emailHtml: `
      <div style="font-family:'Inter',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:48px;">💰</span>
        </div>
        <h1 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:900;text-align:center;color:#111827;margin-bottom:8px;">
          Weekly Earnings
        </h1>
        <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:32px;font-weight:900;text-align:center;color:#1E9E5A;margin-bottom:8px;">
          ${vars.total}
        </p>
        <p style="color:rgba(17,24,39,0.55);font-size:13px;text-align:center;margin-bottom:24px;">
          ${vars.trips} trips · ${vars.week}
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:12px 16px;border:1px solid rgba(0,0,0,0.07);border-radius:8px;text-align:center;">
              <div style="font-size:11px;color:rgba(17,24,39,0.55);">Trips</div>
              <div style="font-weight:800;font-size:18px;">${vars.trips}</div>
            </td>
            <td style="padding:12px 16px;border:1px solid rgba(0,0,0,0.07);border-radius:8px;text-align:center;">
              <div style="font-size:11px;color:rgba(17,24,39,0.55);">Tips</div>
              <div style="font-weight:800;font-size:18px;">${vars.tips || "R0"}</div>
            </td>
            <td style="padding:12px 16px;border:1px solid rgba(0,0,0,0.07);border-radius:8px;text-align:center;">
              <div style="font-size:11px;color:rgba(17,24,39,0.55);">Rating</div>
              <div style="font-weight:800;font-size:18px;">★ ${vars.rating || "—"}</div>
            </td>
          </tr>
        </table>
        <p style="color:rgba(17,24,39,0.55);font-size:13px;text-align:center;">
          Payout via EFT on Friday.
        </p>
        ${emailFooter()}
      </div>
    `,
  };
}

function orderEmailBlock(orderNumber: string, heading: string, detail: string, accentColor: string): string {
  return `
    <div style="font-family:'Inter',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
      <div style="text-align:center;margin-bottom:20px;">
        <span style="font-size:40px;">🛵</span>
      </div>
      <h1 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:900;text-align:center;color:#111827;margin-bottom:6px;">
        ${heading}
      </h1>
      <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;color:${accentColor};font-weight:700;text-align:center;margin-bottom:16px;">
        ${orderNumber}
      </p>
      <p style="color:rgba(17,24,39,0.65);font-size:14px;line-height:1.6;text-align:center;margin-bottom:24px;">
        ${detail}
      </p>
      <div style="text-align:center;">
        <a href="https://overberg-go.vercel.app/orders" style="display:inline-block;background:${accentColor};color:white;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none;font-size:14px;">
          Track Order
        </a>
      </div>
      ${emailFooter()}
    </div>
  `;
}

function emailFooter(): string {
  return `
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(0,0,0,0.07);text-align:center;">
      <p style="font-size:11px;color:rgba(17,24,39,0.35);">
        OverBerg Go · Cape Agulhas, Western Cape
      </p>
      <p style="font-size:11px;color:rgba(17,24,39,0.35);margin-top:4px;">
        You're receiving this because you have an account with OverBerg Go.
      </p>
    </div>
  `;
}

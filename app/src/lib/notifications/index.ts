/**
 * Unified notification dispatch.
 * Sends across all configured channels: in-app (DB), FCM push, Twilio SMS, Brevo email.
 * Each channel gracefully skips if credentials are missing.
 */

import { sendPushToUser } from "./fcm";
import { sendSmsToUser } from "./sms";
import { sendEmailToUser } from "./email";
import type { NotificationTemplate } from "./templates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

export interface NotifyOptions {
  userId: string;
  template: NotificationTemplate;
  channels?: ("push" | "sms" | "email")[];
  data?: Record<string, string>;
}

export interface NotifyResult {
  inApp: boolean;
  push: boolean;
  sms: boolean;
  email: boolean;
}

export async function notify(admin: AdminClient, opts: NotifyOptions): Promise<NotifyResult> {
  const channels = opts.channels || ["push", "sms", "email"];
  const result: NotifyResult = { inApp: false, push: false, sms: false, email: false };

  // Always write to notifications table (in-app)
  const { error: dbErr } = await admin.from("notifications").insert({
    user_id: opts.userId,
    type: "order" as const,
    title: opts.template.title,
    message: opts.template.body,
    emoji: opts.template.emoji,
    data: opts.data || null,
  });
  result.inApp = !dbErr;

  // Fire push/sms/email in parallel — all non-blocking
  const promises: Promise<void>[] = [];

  if (channels.includes("push")) {
    promises.push(
      sendPushToUser(admin, opts.userId, opts.template.title, opts.template.body, opts.data)
        .then((r) => { result.push = r.ok; })
        .catch(() => { result.push = false; })
    );
  }

  if (channels.includes("sms") && opts.template.sms) {
    promises.push(
      sendSmsToUser(admin, opts.userId, opts.template.sms)
        .then((r) => { result.sms = r.ok; })
        .catch(() => { result.sms = false; })
    );
  }

  if (channels.includes("email") && opts.template.emailSubject && opts.template.emailHtml) {
    promises.push(
      sendEmailToUser(admin, opts.userId, opts.template.emailSubject, opts.template.emailHtml)
        .then((r) => { result.email = r.ok; })
        .catch(() => { result.email = false; })
    );
  }

  await Promise.allSettled(promises);
  return result;
}

export { sendPush, sendPushToUser } from "./fcm";
export { sendSms, sendSmsToUser } from "./sms";
export { sendEmail, sendEmailToUser } from "./email";
export { getOrderTemplate, getDriverAssignedTemplate, getWelcomeTemplate, getWeeklyStatementTemplate } from "./templates";
export type { NotificationTemplate } from "./templates";

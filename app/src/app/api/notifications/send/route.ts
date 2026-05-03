import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";
import type { NotificationTemplate } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, title, message, emoji, channels, data } = body;

  const targetUserId = userId || user.id;

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const template: NotificationTemplate = {
    title,
    body: message || "",
    emoji: emoji || "🔔",
    sms: message || title,
    emailSubject: title,
    emailHtml: `<div style="font-family:Inter,sans-serif;padding:24px;text-align:center;"><h2>${title}</h2><p>${message || ""}</p></div>`,
  };

  const admin = createAdminClient();
  const result = await notify(admin, {
    userId: targetUserId,
    template,
    channels: channels || ["push"],
    data: data || {},
  });

  return NextResponse.json({ ok: true, result });
}

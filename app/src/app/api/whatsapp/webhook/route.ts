import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage, sendWhatsAppInteractive } from "@/lib/whatsapp/client";
import { processMessage, generatePrefillToken } from "@/lib/whatsapp/agent";

const VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN || "overberg_go_verify_2024";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://overberg-go.vercel.app";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const entries = body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const messages = change.value?.messages || [];
      for (const msg of messages) {
        if (msg.type === "text" && msg.text?.body) {
          await handleIncomingMessage(
            msg.from,
            msg.text.body,
            change.value?.contacts?.[0]?.profile?.name || null
          );
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleIncomingMessage(phone: string, text: string, senderName: string | null) {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("whatsapp_conversations")
    .select("*")
    .eq("customer_phone", phone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const conversation = existing as {
    id: string;
    customer_phone: string;
    customer_name: string | null;
    intent_state: string;
    cart_draft: { name: string; price: number; quantity: number; menu_item_id?: string }[];
    message_count: number;
  } | null;

  const agentResponse = await processMessage(
    phone,
    text,
    conversation ? {
      id: conversation.id,
      customer_phone: conversation.customer_phone,
      customer_name: conversation.customer_name,
      intent_state: conversation.intent_state,
      cart_draft: conversation.cart_draft || [],
      message_count: conversation.message_count,
    } : undefined
  );

  if (conversation) {
    await admin
      .from("whatsapp_conversations")
      .update({
        last_message: text,
        last_bot_reply: agentResponse.reply,
        intent_state: agentResponse.newState,
        cart_draft: agentResponse.cartDraft,
        message_count: conversation.message_count + 1,
        customer_name: senderName || conversation.customer_name,
      })
      .eq("id", conversation.id);
  } else {
    await admin.from("whatsapp_conversations").insert({
      customer_phone: phone,
      customer_name: senderName,
      last_message: text,
      last_bot_reply: agentResponse.reply,
      intent_state: agentResponse.newState,
      cart_draft: agentResponse.cartDraft,
      message_count: 1,
    });
  }

  if (agentResponse.generateLink && agentResponse.cartDraft.length > 0) {
    const token = await generatePrefillToken(phone, agentResponse.cartDraft);
    const cartUrl = `${APP_URL}/cart?prefill=${token}`;

    await sendWhatsAppMessage(phone, agentResponse.reply);
    await sendWhatsAppInteractive(
      phone,
      "🛒 Your order is ready!",
      `${agentResponse.cartDraft.length} items · R${agentResponse.cartDraft.reduce((s, i) => s + i.price * i.quantity, 0)}`,
      "Complete Order",
      cartUrl
    );
  } else {
    await sendWhatsAppMessage(phone, agentResponse.reply);
  }
}

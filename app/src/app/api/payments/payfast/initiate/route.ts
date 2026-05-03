import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPayfastPayload } from "@/lib/payfast/client";

interface InitiateBody {
  amount: number;
  intent: "wallet_topup" | "order_payment";
  itemName: string;
  itemDescription?: string;
  orderId?: string;
}

export async function POST(request: NextRequest) {
  let body: InitiateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.amount || body.amount < 5) {
    return NextResponse.json({ error: "amount_too_low" }, { status: 400 });
  }
  if (!body.intent || !body.itemName) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Create payment row using admin client (RLS-safe, allows server defaults)
  const admin = createAdminClient();
  const { data: payment, error: insertError } = await admin
    .from("payments")
    .insert({
      user_id: user.id,
      order_id: body.orderId || null,
      amount: body.amount,
      currency: "ZAR",
      provider: "payfast",
      status: "pending",
      payload: { intent: body.intent, item_name: body.itemName },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select()
    .single();

  if (insertError || !payment) {
    return NextResponse.json(
      { error: "payment_create_failed", detail: insertError?.message },
      { status: 500 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin.replace(/\/$/, "");

  // Fetch profile for prefill
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  const profileRow = profile as { full_name: string | null; phone: string | null } | null;
  const [firstName, ...rest] = (profileRow?.full_name || "").split(" ");

  const paymentRow = payment as { id: string };

  const { url, fields } = buildPayfastPayload({
    amount: body.amount,
    itemName: body.itemName,
    itemDescription: body.itemDescription,
    paymentId: paymentRow.id,
    userId: user.id,
    email: user.email || undefined,
    firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined,
    cellNumber: profileRow?.phone || undefined,
    returnUrl: `${appUrl}/payments/return?payment_id=${paymentRow.id}`,
    cancelUrl: `${appUrl}/payments/cancel?payment_id=${paymentRow.id}`,
    notifyUrl: `${appUrl}/api/payments/payfast/itn`,
    intent: body.intent,
  });

  return NextResponse.json({
    payment_id: paymentRow.id,
    url,
    fields,
  });
}

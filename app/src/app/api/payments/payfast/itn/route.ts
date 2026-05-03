import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignature } from "@/lib/payfast/signature";
import { isValidPayfastIp, validateWithPayfast } from "@/lib/payfast/verify";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const received: Record<string, string> = {};
  params.forEach((v, k) => {
    received[k] = v;
  });

  // 1. Source IP check (skipped in sandbox)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    null;
  if (!isValidPayfastIp(ip)) {
    return NextResponse.json({ error: "invalid_source_ip" }, { status: 403 });
  }

  // 2. Signature check
  if (!verifySignature(received)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // 3. Server-to-server validation with PayFast
  const valid = await validateWithPayfast(rawBody);
  if (!valid) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const paymentId = received.custom_str1 || received.m_payment_id;
  const intent = received.custom_str2 || "order_payment";
  const userId = received.custom_str3;
  const status = received.payment_status; // COMPLETE, FAILED, CANCELLED
  const grossAmount = parseFloat(received.amount_gross || "0");
  const providerRef = received.pf_payment_id;

  if (!paymentId || !userId) {
    return NextResponse.json({ error: "missing_custom_data" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 4. Load payment row, verify amount matches
  const { data: payment, error: loadError } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (loadError || !payment) {
    return NextResponse.json({ error: "payment_not_found" }, { status: 404 });
  }

  const paymentRow = payment as {
    id: string;
    user_id: string | null;
    order_id: string | null;
    amount: number;
    status: string;
  };

  if (Math.abs(Number(paymentRow.amount) - grossAmount) > 0.01) {
    return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });
  }

  if (paymentRow.user_id !== userId) {
    return NextResponse.json({ error: "user_mismatch" }, { status: 400 });
  }

  // 5. Idempotency — if already completed, no-op
  if (paymentRow.status === "completed" && status === "COMPLETE") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // 6. Update payment status
  const newStatus =
    status === "COMPLETE"
      ? "completed"
      : status === "FAILED"
      ? "failed"
      : status === "CANCELLED"
      ? "cancelled"
      : "processing";

  const updatePayload = {
    status: newStatus,
    provider_ref: providerRef,
    payload: { ...((paymentRow as unknown as { payload?: object }).payload || {}), itn: received },
    updated_at: new Date().toISOString(),
  };
  const { error: updateError } = await admin
    .from("payments")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updatePayload as any)
    .eq("id", paymentId);

  if (updateError) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  // 7. Side-effects on COMPLETE
  if (status === "COMPLETE") {
    if (intent === "wallet_topup") {
      // Credit wallet
      const { error: creditError } = await admin.rpc("wallet_credit", {
        p_user_id: userId,
        p_amount: grossAmount,
        p_type: "topup",
        p_description: `Wallet top-up · PayFast ${providerRef}`,
        p_reference: providerRef,
        p_payment_id: paymentId,
        p_order_id: null,
        p_metadata: { provider: "payfast" },
      });
      if (creditError) {
        return NextResponse.json(
          { error: "wallet_credit_failed", detail: creditError.message },
          { status: 500 }
        );
      }
    } else if (intent === "order_payment" && paymentRow.order_id) {
      const orderUpdate = { payment_status: "paid", updated_at: new Date().toISOString() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await admin.from("orders").update(orderUpdate as any).eq("id", paymentRow.order_id);
    }
  }

  return NextResponse.json({ ok: true });
}

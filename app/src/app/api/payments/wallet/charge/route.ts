import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ChargeBody {
  amount: number;
  description: string;
  orderId?: string;
  cashbackRate?: number; // e.g. 0.05 for 5%
}

export async function POST(request: NextRequest) {
  let body: ChargeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.amount || body.amount < 1 || !body.description) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Create wallet payment row
  const { data: payment, error: insertError } = await admin
    .from("payments")
    .insert({
      user_id: user.id,
      order_id: body.orderId || null,
      amount: body.amount,
      currency: "ZAR",
      provider: "wallet",
      status: "processing",
      payload: { description: body.description },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select()
    .single();

  if (insertError || !payment) {
    return NextResponse.json({ error: "payment_create_failed" }, { status: 500 });
  }

  const paymentRow = payment as { id: string };

  // Debit wallet atomically
  const { data: debitResult, error: debitError } = await admin.rpc("wallet_debit", {
    p_user_id: user.id,
    p_amount: body.amount,
    p_type: "payment",
    p_description: body.description,
    p_reference: null,
    p_payment_id: paymentRow.id,
    p_order_id: body.orderId || null,
    p_metadata: null,
  });

  if (debitError) {
    const failUpdate = { status: "failed", updated_at: new Date().toISOString() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from("payments").update(failUpdate as any).eq("id", paymentRow.id);

    if (debitError.message?.includes("insufficient_balance")) {
      return NextResponse.json({ error: "insufficient_balance" }, { status: 402 });
    }
    return NextResponse.json({ error: "debit_failed" }, { status: 500 });
  }

  const result = (debitResult as Array<{ new_balance: number }>)?.[0];

  // Credit cashback if applicable
  let cashbackAmount = 0;
  if (body.cashbackRate && body.cashbackRate > 0) {
    cashbackAmount = Math.round(body.amount * body.cashbackRate);
    if (cashbackAmount > 0) {
      await admin.rpc("wallet_credit", {
        p_user_id: user.id,
        p_amount: cashbackAmount,
        p_type: "cashback",
        p_description: `${Math.round(body.cashbackRate * 100)}% cashback`,
        p_reference: null,
        p_payment_id: paymentRow.id,
        p_order_id: body.orderId || null,
        p_metadata: null,
      });
    }
  }

  // Mark payment completed and order paid
  const completeUpdate = { status: "completed", updated_at: new Date().toISOString() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await admin.from("payments").update(completeUpdate as any).eq("id", paymentRow.id);

  if (body.orderId) {
    const orderUpdate = { payment_status: "paid", updated_at: new Date().toISOString() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from("orders").update(orderUpdate as any).eq("id", body.orderId);
  }

  return NextResponse.json({
    payment_id: paymentRow.id,
    new_balance: result?.new_balance ?? null,
    cashback: cashbackAmount,
  });
}

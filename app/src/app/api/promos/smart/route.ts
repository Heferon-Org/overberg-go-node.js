import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Smart promo generation endpoint.
 * Checks users who haven't ordered in 14+ days and generates a personal
 * WELCOME_BACK promo code for them. Called via cron or manually.
 */
export async function POST() {
  const admin = createAdminClient();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();

  const { data: recentCustomers } = await admin
    .from("orders")
    .select("customer_id")
    .gte("created_at", fourteenDaysAgo);

  const recentIds = new Set((recentCustomers || []).map((r: { customer_id: string }) => r.customer_id));

  const { data: allCustomers } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "customer");

  const lapsedCustomers = ((allCustomers || []) as { id: string; full_name: string | null }[])
    .filter((c) => !recentIds.has(c.id));

  let generated = 0;

  for (const customer of lapsedCustomers.slice(0, 50)) {
    const code = `BACK_${customer.id.slice(0, 6).toUpperCase()}`;

    const { data: existing } = await admin
      .from("promo_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (existing) continue;

    await admin.from("promo_codes").insert({
      code,
      description: `Welcome back, ${customer.full_name || "friend"}! 15% off your next order`,
      discount_type: "percent",
      discount_value: 15,
      min_order_amount: 50,
      max_discount: 60,
      applies_to: "all",
      usage_limit: 1,
      per_user_limit: 1,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 48 * 3600000).toISOString(),
      active: true,
    });

    await admin.from("notifications").insert({
      user_id: customer.id,
      type: "promo",
      title: "We miss you! 🌊",
      message: `Use code ${code} for 15% off your next order. Valid 48 hours.`,
      emoji: "🎟️",
      data: { code, discount: "15%" },
    });

    generated++;
  }

  return NextResponse.json({ ok: true, generated, lapsed: lapsedCustomers.length });
}

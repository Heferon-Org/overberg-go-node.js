// Supabase Edge Function — weekly-payouts
//
// Schedule (set in Supabase Dashboard → Edge Functions → Cron):
//   0 15 * * 5  — Friday 17:00 SAST (15:00 UTC)
//
// Aggregates pending driver_earnings + merchant_earnings into payouts rows,
// marks earnings as paid, returns a summary. Brevo email + PDF invoice
// generation are stubbed — Phase 7 will plug them in.

// @ts-expect-error Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
// @ts-expect-error Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface DriverAggregate {
  driver_id: string;
  total: number;
  earning_ids: string[];
}

interface MerchantAggregate {
  restaurant_id: string;
  total: number;
  earning_ids: string[];
}

serve(async (req) => {
  // @ts-expect-error Deno runtime
  const url = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error Deno runtime
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Optional: gate on shared secret to avoid public invocation
  // @ts-expect-error Deno runtime
  const expectedAuth = Deno.env.get("PAYOUT_RUN_SECRET");
  if (expectedAuth) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expectedAuth}`) {
      return new Response("unauthorized", { status: 401 });
    }
  }

  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun .. 5=Fri
  // Period: previous Saturday → this Friday (SAST week)
  const periodEnd = new Date(now);
  periodEnd.setUTCDate(now.getUTCDate() - ((day + 1) % 7));
  const periodStart = new Date(periodEnd);
  periodStart.setUTCDate(periodEnd.getUTCDate() - 6);

  const periodStartStr = periodStart.toISOString().split("T")[0];
  const periodEndStr = periodEnd.toISOString().split("T")[0];

  // ─── DRIVER PAYOUTS ───────────────────────────────────────
  const { data: driverEarnings } = await admin
    .from("driver_earnings")
    .select("id, driver_id, amount")
    .eq("payout_status", "pending");

  const driverMap = new Map<string, DriverAggregate>();
  for (const row of (driverEarnings || []) as Array<{
    id: string;
    driver_id: string;
    amount: number;
  }>) {
    const agg = driverMap.get(row.driver_id) || {
      driver_id: row.driver_id,
      total: 0,
      earning_ids: [],
    };
    agg.total += Number(row.amount);
    agg.earning_ids.push(row.id);
    driverMap.set(row.driver_id, agg);
  }

  const driverPayouts: Array<{ driver_id: string; payout_id: string; amount: number }> = [];
  for (const agg of driverMap.values()) {
    if (agg.total <= 0) continue;

    const { data: payout } = await admin
      .from("payouts")
      .insert({
        recipient_type: "driver",
        recipient_id: agg.driver_id,
        period_start: periodStartStr,
        period_end: periodEndStr,
        total_amount: agg.total,
        status: "draft",
      })
      .select()
      .single();

    if (!payout) continue;
    const payoutId = (payout as { id: string }).id;

    await admin
      .from("driver_earnings")
      .update({ payout_status: "paid", payout_id: payoutId })
      .in("id", agg.earning_ids);

    driverPayouts.push({ driver_id: agg.driver_id, payout_id: payoutId, amount: agg.total });
  }

  // ─── MERCHANT PAYOUTS ──────────────────────────────────────
  const { data: merchantEarnings } = await admin
    .from("merchant_earnings")
    .select("id, restaurant_id, net_amount")
    .eq("payout_status", "pending");

  const merchantMap = new Map<string, MerchantAggregate>();
  for (const row of (merchantEarnings || []) as Array<{
    id: string;
    restaurant_id: string;
    net_amount: number;
  }>) {
    const agg = merchantMap.get(row.restaurant_id) || {
      restaurant_id: row.restaurant_id,
      total: 0,
      earning_ids: [],
    };
    agg.total += Number(row.net_amount);
    agg.earning_ids.push(row.id);
    merchantMap.set(row.restaurant_id, agg);
  }

  const merchantPayouts: Array<{ restaurant_id: string; payout_id: string; amount: number }> = [];
  for (const agg of merchantMap.values()) {
    if (agg.total <= 0) continue;

    const { data: payout } = await admin
      .from("payouts")
      .insert({
        recipient_type: "merchant",
        recipient_id: agg.restaurant_id,
        period_start: periodStartStr,
        period_end: periodEndStr,
        total_amount: agg.total,
        status: "draft",
      })
      .select()
      .single();

    if (!payout) continue;
    const payoutId = (payout as { id: string }).id;

    await admin
      .from("merchant_earnings")
      .update({ payout_status: "paid", payout_id: payoutId })
      .in("id", agg.earning_ids);

    merchantPayouts.push({
      restaurant_id: agg.restaurant_id,
      payout_id: payoutId,
      amount: agg.total,
    });
  }

  // TODO Phase 7: generate PDF invoice + Brevo email
  // For now, log and return summary.
  console.log("Weekly payout run", {
    period: `${periodStartStr} → ${periodEndStr}`,
    driver_payouts: driverPayouts.length,
    merchant_payouts: merchantPayouts.length,
  });

  return new Response(
    JSON.stringify({
      ok: true,
      period: { start: periodStartStr, end: periodEndStr },
      driver_payouts: driverPayouts,
      merchant_payouts: merchantPayouts,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});

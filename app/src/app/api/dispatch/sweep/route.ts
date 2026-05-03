import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invokeDispatch } from "@/lib/dispatch/invoke";

/**
 * Sweep stale dispatch offers (>30s) → mark timed_out and re-dispatch.
 * Run on a 1-minute cron (Vercel Cron or pg_cron).
 *
 * Auth: header `x-dispatch-secret` if DISPATCH_SECRET is set.
 */
export async function POST(req: Request) {
  const expected = process.env.DISPATCH_SECRET;
  if (expected) {
    const got = req.headers.get("x-dispatch-secret");
    if (got !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 30_000).toISOString();

  const { data: stale } = await admin
    .from("dispatch_logs")
    .select("id, order_id, driver_id, attempt_number")
    .eq("action", "offered")
    .lt("created_at", cutoff);

  const staleRows = (stale || []) as Array<{
    id: string;
    order_id: string;
    driver_id: string;
    attempt_number: number;
  }>;

  // Filter to those whose order still has no driver_id (others got accepted)
  const toExpire: typeof staleRows = [];
  for (const row of staleRows) {
    const { data: order } = await admin
      .from("orders")
      .select("driver_id, dispatch_status")
      .eq("id", row.order_id)
      .single();
    const o = order as { driver_id: string | null; dispatch_status: string } | null;
    if (o && !o.driver_id && o.dispatch_status === "searching") {
      toExpire.push(row);
    }
  }

  for (const row of toExpire) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from("dispatch_logs").insert({
      order_id: row.order_id,
      driver_id: row.driver_id,
      attempt_number: row.attempt_number,
      action: "timed_out",
    } as any);
    await invokeDispatch(row.order_id);
  }

  return NextResponse.json({ ok: true, expired: toExpire.length });
}

export const GET = POST;

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { invokeDispatch } from "@/lib/dispatch/invoke";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { order_id, response } = body as { order_id?: string; response?: "accept" | "reject" };
  if (!order_id || !["accept", "reject"].includes(response || "")) {
    return NextResponse.json({ error: "order_id and response (accept|reject) required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find the most recent open offer for this driver on this order
  const { data: offerRow } = await admin
    .from("dispatch_logs")
    .select("id, attempt_number, created_at, action, driver_id")
    .eq("order_id", order_id)
    .eq("driver_id", user.id)
    .eq("action", "offered")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const offer = offerRow as {
    id: string;
    attempt_number: number;
    created_at: string;
    action: string;
    driver_id: string;
  } | null;

  if (!offer) {
    return NextResponse.json({ error: "no active offer for this driver" }, { status: 404 });
  }

  // Expired? (>30s)
  const ageMs = Date.now() - new Date(offer.created_at).getTime();
  if (ageMs > 30_000) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from("dispatch_logs").insert({
      order_id,
      driver_id: user.id,
      attempt_number: offer.attempt_number,
      action: "timed_out",
    } as any);
    // Re-dispatch to next driver
    await invokeDispatch(order_id);
    return NextResponse.json({ ok: false, error: "offer expired" }, { status: 410 });
  }

  if (response === "accept") {
    // Atomically claim the order — only succeed if driver_id is still null
    const { data: updated, error: updErr } = await admin
      .from("orders")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        driver_id: user.id,
        dispatch_status: "assigned",
        status: "preparing",
      } as any)
      .eq("id", order_id)
      .is("driver_id", null)
      .select()
      .maybeSingle();

    if (updErr || !updated) {
      return NextResponse.json({ error: "order already taken" }, { status: 409 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from("dispatch_logs").insert({
      order_id,
      driver_id: user.id,
      attempt_number: offer.attempt_number,
      action: "accepted",
    } as any);

    return NextResponse.json({ ok: true, status: "accepted" });
  }

  // Reject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await admin.from("dispatch_logs").insert({
    order_id,
    driver_id: user.id,
    attempt_number: offer.attempt_number,
    action: "rejected",
  } as any);

  // Re-dispatch
  const next = await invokeDispatch(order_id);
  return NextResponse.json({ ok: true, status: "rejected", next_dispatch: next.ok });
}

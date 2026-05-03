// Supabase Edge Function — dispatch-order
//
// Invoked when an order moves to status='confirmed' (dispatch_status='searching').
// Finds the nearest verified, online, idle driver within 10km of the restaurant
// pickup point. Inserts a dispatch_logs row with action='offered' and a 30s
// expiry. The driver app polls/listens for offers and responds via the
// /api/driver/dispatch/respond Next.js endpoint.
//
// Auth: requires header `x-dispatch-secret: <DISPATCH_SECRET>` if set.
// Body: `{ "order_id": "<uuid>" }`

// @ts-expect-error Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
// @ts-expect-error Deno runtime
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OFFER_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 5;
const SEARCH_RADIUS_KM = 10;

interface OrderRow {
  id: string;
  restaurant_id: string;
  driver_id: string | null;
  delivery_fee: number;
  total: number;
  status: string;
  dispatch_status: string;
  delivery_address: string | null;
}

interface NearbyDriver {
  driver_id: string;
  distance_km: number;
}

serve(async (req) => {
  // @ts-expect-error Deno runtime
  const url = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error Deno runtime
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // @ts-expect-error Deno runtime
  const expectedSecret = Deno.env.get("DISPATCH_SECRET");

  if (expectedSecret) {
    const got = req.headers.get("x-dispatch-secret");
    if (got !== expectedSecret) {
      return new Response("unauthorized", { status: 401 });
    }
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let body: { order_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  const orderId = body.order_id;
  if (!orderId) return new Response("order_id required", { status: 400 });

  // Fetch order + restaurant pickup coords
  const { data: order } = await admin
    .from("orders")
    .select("id, restaurant_id, driver_id, delivery_fee, total, status, dispatch_status")
    .eq("id", orderId)
    .single();

  if (!order) return new Response("order not found", { status: 404 });
  const o = order as OrderRow;
  if (o.driver_id) {
    return jsonResponse({ ok: true, message: "already assigned", driver_id: o.driver_id });
  }

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("latitude, longitude, name")
    .eq("id", o.restaurant_id)
    .single();
  const r = restaurant as { latitude: number; longitude: number; name: string } | null;
  if (!r?.latitude || !r?.longitude) {
    await markFailed(admin, orderId, "restaurant has no pickup coords");
    return jsonResponse({ ok: false, error: "restaurant missing coords" }, 422);
  }

  // Count prior attempts for this order
  const { count: priorOffers } = await admin
    .from("dispatch_logs")
    .select("*", { count: "exact", head: true })
    .eq("order_id", orderId)
    .eq("action", "offered");
  const attemptNumber = (priorOffers || 0) + 1;

  if (attemptNumber > MAX_ATTEMPTS) {
    await markFailed(admin, orderId, `exceeded ${MAX_ATTEMPTS} dispatch attempts`);
    return jsonResponse({ ok: false, error: "no drivers available after retries" }, 422);
  }

  // Drivers we've already offered → don't offer again
  const { data: prior } = await admin
    .from("dispatch_logs")
    .select("driver_id")
    .eq("order_id", orderId)
    .in("action", ["offered", "rejected", "timed_out"]);
  const tried = new Set((prior || []).map((p: { driver_id: string }) => p.driver_id));

  // Find nearest available drivers via RPC
  const { data: nearby } = await admin.rpc("find_nearest_drivers", {
    p_lat: r.latitude,
    p_lng: r.longitude,
    p_max_km: SEARCH_RADIUS_KM,
    p_limit: 10,
  });

  const candidates = ((nearby || []) as NearbyDriver[]).filter(
    (d) => !tried.has(d.driver_id)
  );

  if (candidates.length === 0) {
    await markFailed(admin, orderId, "no drivers within radius");
    return jsonResponse({ ok: false, error: "no drivers available" }, 422);
  }

  const target = candidates[0];

  // Log the offer
  await admin.from("dispatch_logs").insert({
    order_id: orderId,
    driver_id: target.driver_id,
    attempt_number: attemptNumber,
    action: "offered",
    distance_km: target.distance_km,
    notes: `pickup ${r.name}`,
  });

  // Push notification (FCM stub — Phase 7 plugs this in)
  console.log("[dispatch] offered", {
    order_id: orderId,
    driver_id: target.driver_id,
    distance_km: target.distance_km,
    fee: o.delivery_fee,
  });

  // TODO Phase 7: send FCM push to driver
  // await sendFcmPush(target.driver_id, {
  //   title: "New order",
  //   body: `R${o.delivery_fee} · ${target.distance_km.toFixed(1)}km`,
  //   data: { order_id: orderId, type: "dispatch_offer" },
  // });

  // Schedule timeout: re-invoke this function after OFFER_TIMEOUT_MS
  // Edge functions can't sleep; we rely on the driver responding within 30s.
  // If they don't, the responder API or a periodic sweeper marks timed_out
  // and re-runs dispatch.

  return jsonResponse({
    ok: true,
    order_id: orderId,
    offered_to: target.driver_id,
    distance_km: target.distance_km,
    attempt_number: attemptNumber,
    expires_at: new Date(Date.now() + OFFER_TIMEOUT_MS).toISOString(),
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markFailed(admin: any, orderId: string, reason: string) {
  await admin
    .from("orders")
    .update({ dispatch_status: "failed" })
    .eq("id", orderId);
  await admin.from("dispatch_logs").insert({
    order_id: orderId,
    action: "cancelled",
    notes: reason,
  });
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

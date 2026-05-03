import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notifyOrderTransition } from "@/lib/notifications/order-transitions";
import type { OrderStatus } from "@/lib/supabase/types";

const VENDOR_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: [],
  picked_up: [],
  on_the_way: [],
  delivered: [],
  cancelled: [],
};

const DRIVER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: [],
  confirmed: [],
  preparing: [],
  ready: ["picked_up"],
  picked_up: ["on_the_way"],
  on_the_way: ["delivered"],
  delivered: [],
  cancelled: [],
};

const CUSTOMER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["cancelled"],
  confirmed: ["cancelled"],
  preparing: [],
  ready: [],
  picked_up: [],
  on_the_way: [],
  delivered: [],
  cancelled: [],
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status = body?.status as OrderStatus | undefined;
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: orderRow } = await admin
    .from("orders")
    .select("id, order_number, status, customer_id, driver_id, restaurant_id, delivery_code")
    .eq("id", orderId)
    .single();

  const order = orderRow as {
    id: string;
    order_number: string;
    status: OrderStatus;
    customer_id: string;
    driver_id: string | null;
    restaurant_id: string;
    delivery_code: string | null;
  } | null;

  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  // Resolve role for this user against this order
  let role: "vendor" | "driver" | "customer" | null = null;

  if (order.customer_id === user.id) role = "customer";
  else if (order.driver_id === user.id) role = "driver";
  else {
    const { data: restaurantRow } = await admin
      .from("restaurants")
      .select("owner_id")
      .eq("id", order.restaurant_id)
      .single();
    const r = restaurantRow as { owner_id: string | null } | null;
    if (r?.owner_id === user.id) role = "vendor";
  }

  if (!role) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const allowed =
    role === "vendor" ? VENDOR_TRANSITIONS[order.status] :
    role === "driver" ? DRIVER_TRANSITIONS[order.status] :
    CUSTOMER_TRANSITIONS[order.status];

  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `${role} cannot transition ${order.status} → ${status}` },
      { status: 422 }
    );
  }

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "delivered") updates.delivered_at = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updErr } = await admin.from("orders").update(updates as any).eq("id", orderId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  await notifyOrderTransition(admin, {
    orderId: order.id,
    customerId: order.customer_id,
    driverId: order.driver_id,
    restaurantId: order.restaurant_id,
    orderNumber: order.order_number,
    newStatus: status,
    oldStatus: order.status,
    deliveryCode: order.delivery_code,
  });

  return NextResponse.json({ ok: true, order_id: orderId, status });
}

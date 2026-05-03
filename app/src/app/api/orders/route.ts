import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { invokeDispatch } from "@/lib/dispatch/invoke";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

interface CreateOrderBody {
  restaurant_id: string;
  items: OrderItem[];
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  payment_method?: string;
  notes?: string;
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateOrderBody | null;
  if (!body?.restaurant_id || !body?.items?.length) {
    return NextResponse.json({ error: "restaurant_id and items required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const subtotal = body.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = 35;
  const serviceFee = Math.round(subtotal * 0.05);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: insErr } = await admin
    .from("orders")
    .insert({
      customer_id: user.id,
      restaurant_id: body.restaurant_id,
      items: body.items as unknown,
      subtotal,
      delivery_fee: deliveryFee,
      service_fee: serviceFee,
      total: subtotal + deliveryFee + serviceFee,
      delivery_address: body.delivery_address,
      delivery_latitude: body.delivery_latitude ?? null,
      delivery_longitude: body.delivery_longitude ?? null,
      payment_method: body.payment_method || "wallet",
      notes: body.notes || null,
      status: "placed",
    } as any)
    .select()
    .single();

  if (insErr || !order) {
    return NextResponse.json({ error: insErr?.message || "insert failed" }, { status: 500 });
  }

  const orderRow = order as { id: string; surge_multiplier: number; surge_zone_id: string | null; total: number };

  // Auto-confirm + dispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await admin.from("orders").update({ status: "confirmed" } as any).eq("id", orderRow.id);
  const dispatch = await invokeDispatch(orderRow.id);

  return NextResponse.json({
    ok: true,
    order_id: orderRow.id,
    surge_multiplier: orderRow.surge_multiplier,
    surge_active: orderRow.surge_zone_id !== null,
    total: orderRow.total,
    dispatch_invoked: dispatch.ok,
  });
}

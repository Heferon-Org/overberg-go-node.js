import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const userId = user.id;

  await Promise.allSettled([
    admin.from("notifications").delete().eq("user_id", userId),
    admin.from("wallet_transactions").delete().eq("user_id", userId),
    admin.from("support_tickets").delete().eq("user_id", userId),
    admin.from("reviews").delete().eq("user_id", userId),
    admin.from("driver_ratings").delete().eq("customer_id", userId),
    admin.from("prescriptions").delete().eq("customer_id", userId),
    admin.from("service_bids").delete().eq("provider_id", userId),
    admin.from("user_push_tokens").delete().eq("user_id", userId),
    admin.from("whatsapp_conversations").delete().eq("user_id", userId),
  ]);

  await admin.from("orders").update({
    delivery_address: null,
    delivery_latitude: null,
    delivery_longitude: null,
    notes: null,
  }).eq("customer_id", userId);

  await admin.from("profiles").delete().eq("id", userId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Account and personal data deleted" });
}

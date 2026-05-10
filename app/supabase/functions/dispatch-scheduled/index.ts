import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);

  const { data: orders, error } = await admin
    .from("orders")
    .select("id, service_type, scheduled_for")
    .not("scheduled_for", "is", null)
    .eq("status", "placed")
    .eq("dispatch_status", "idle")
    .lte("scheduled_for", windowEnd.toISOString())
    .gte("scheduled_for", now.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dispatched: string[] = [];

  for (const order of orders ?? []) {
    await admin
      .from("orders")
      .update({ status: "confirmed", dispatch_status: "searching" })
      .eq("id", order.id);

    const dispatchResp = await fetch(`${supabaseUrl}/functions/v1/dispatch-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        order_id: order.id,
        service_type: order.service_type,
      }),
    });

    if (dispatchResp.ok) {
      dispatched.push(order.id);
    } else {
      console.error(`Failed to dispatch ${order.id}:`, await dispatchResp.text());
    }
  }

  return new Response(
    JSON.stringify({
      checked: orders?.length ?? 0,
      dispatched: dispatched.length,
      order_ids: dispatched,
      window: { from: now.toISOString(), to: windowEnd.toISOString() },
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

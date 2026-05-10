import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { request_id } = await req.json();
  if (!request_id) {
    return new Response(JSON.stringify({ error: "request_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: request, error: reqError } = await admin
    .from("service_requests")
    .select("*")
    .eq("id", request_id)
    .single();

  if (reqError || !request) {
    return new Response(JSON.stringify({ error: "Request not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const RADIUS_KM = 30;
  const lat = request.latitude;
  const lng = request.longitude;

  let providers: { id: string; phone: string | null; fcm_token: string | null }[] = [];

  if (lat && lng) {
    const { data } = await admin
      .from("profiles")
      .select("id, phone, fcm_token")
      .in("role", ["provider", "driver"]);

    if (data) {
      const { data: driverData } = await admin
        .from("drivers")
        .select("id, latitude, longitude, service_capabilities")
        .eq("is_online", true)
        .eq("kyc_status", "verified");

      const driverMap = new Map(
        (driverData || []).map((d: { id: string; latitude: number; longitude: number; service_capabilities: string[] }) => [d.id, d])
      );

      providers = data.filter((p: { id: string }) => {
        const driver = driverMap.get(p.id) as { latitude: number; longitude: number; service_capabilities: string[] } | undefined;
        if (!driver?.latitude || !driver?.longitude) return false;
        if (!driver.service_capabilities?.includes("home_service")) return false;

        const dist = haversine(lat, lng, driver.latitude, driver.longitude);
        return dist <= RADIUS_KM;
      });
    }
  } else {
    const { data } = await admin
      .from("profiles")
      .select("id, phone, fcm_token")
      .in("role", ["provider", "driver"])
      .limit(50);
    providers = data || [];
  }

  const category = (request.category as string).replace(/_/g, " ");
  const budgetMax = (request.budget_max_cents as number) / 100;
  const title = `New ${category} request`;
  const body = `${request.title} — Budget up to R${budgetMax.toFixed(0)}. Bid now!`;

  let notified = 0;

  for (const provider of providers) {
    if (provider.fcm_token) {
      try {
        const firebaseConfig = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (firebaseConfig) {
          notified++;
        }
      } catch {
        // Skip failed notifications
      }
    }

    if (provider.phone) {
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioSid && twilioToken && twilioFrom) {
        try {
          const phone = provider.phone.startsWith("+") ? provider.phone : `+27${provider.phone.replace(/^0/, "")}`;
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                From: twilioFrom,
                To: phone,
                Body: `${title}\n${body}\n\nOpen the app to bid: https://overberggo.vercel.app/provider/requests`,
              }).toString(),
            }
          );
          notified++;
        } catch {
          // Skip failed SMS
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      providers_found: providers.length,
      notified,
      request_id,
      title,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

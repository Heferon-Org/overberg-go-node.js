/**
 * AI Surge Pricing Engine (Supabase Edge Function)
 * Runs every 5 minutes via cron to calculate demand/supply multipliers per zone.
 *
 * Factors:
 * 1. Demand: orders placed in last 15 min per zone
 * 2. Supply: online drivers per zone
 * 3. Weather: poor weather increases multiplier
 * 4. Events: hardcoded high-demand days
 */

import { createClient } from "supabase";

const HIGH_DEMAND_DATES = [
  "12-16", "12-17", "12-18", "12-19", "12-20", "12-21", "12-22", "12-23", "12-24", "12-25",
  "12-26", "12-27", "12-28", "12-29", "12-30", "12-31", "01-01", "01-02",
  "03-21", "04-27", "05-01", "06-16", "08-09", "09-24", "12-15",
];

const OVERBERG_LAT = -34.77;
const OVERBERG_LNG = 20.05;

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, supabaseKey);

    const { data: zones } = await admin.from("surge_zones").select("*").eq("active", true);
    if (!zones || zones.length === 0) {
      return new Response(JSON.stringify({ message: "No active zones" }), { status: 200 });
    }

    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentOrders } = await admin
      .from("orders")
      .select("delivery_latitude, delivery_longitude")
      .gte("created_at", fifteenMinAgo)
      .neq("status", "cancelled");

    const { data: onlineDrivers } = await admin
      .from("drivers")
      .select("latitude, longitude")
      .eq("is_online", true)
      .not("latitude", "is", null);

    const weatherMultiplier = await getWeatherMultiplier();
    const eventMultiplier = getEventMultiplier();

    const updates: { id: string; multiplier: number; reason: string }[] = [];

    for (const zone of zones) {
      const demand = countInZone(
        (recentOrders || []) as { delivery_latitude: number | null; delivery_longitude: number | null }[],
        zone, "delivery_latitude", "delivery_longitude"
      );

      const supply = countInZone(
        (onlineDrivers || []) as { latitude: number | null; longitude: number | null }[],
        zone, "latitude", "longitude"
      );

      let multiplier = 1.0;
      const reasons: string[] = [];

      // Demand/supply ratio
      if (supply === 0 && demand > 0) {
        multiplier += 0.8;
        reasons.push("no drivers");
      } else if (supply > 0) {
        const ratio = demand / supply;
        if (ratio > 3) { multiplier += 0.7; reasons.push("high demand"); }
        else if (ratio > 2) { multiplier += 0.4; reasons.push("moderate demand"); }
        else if (ratio > 1.5) { multiplier += 0.2; reasons.push("slightly busy"); }
      }

      // Weather factor
      if (weatherMultiplier > 1.0) {
        multiplier += (weatherMultiplier - 1.0);
        reasons.push("weather");
      }

      // Event factor
      if (eventMultiplier > 1.0) {
        multiplier += (eventMultiplier - 1.0);
        reasons.push("holiday/event");
      }

      // Time-of-day factor (lunch 12-14, dinner 18-20 peak)
      const hour = new Date().getHours();
      if ((hour >= 12 && hour <= 13) || (hour >= 18 && hour <= 19)) {
        multiplier += 0.15;
        reasons.push("peak hour");
      }

      // Cap between 1.0x and 2.5x
      multiplier = Math.min(2.5, Math.max(1.0, Math.round(multiplier * 100) / 100));

      updates.push({ id: zone.id, multiplier, reason: reasons.join(", ") || "normal" });
    }

    for (const u of updates) {
      await admin
        .from("surge_zones")
        .update({ multiplier: u.multiplier, reason: u.reason, updated_at: new Date().toISOString() })
        .eq("id", u.id);
    }

    return new Response(
      JSON.stringify({ updated: updates.length, zones: updates }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

function countInZone(
  items: { [key: string]: number | null }[],
  zone: { lat_min: number; lat_max: number; lng_min: number; lng_max: number },
  latKey: string,
  lngKey: string
): number {
  return items.filter((item) => {
    const lat = item[latKey] as number | null;
    const lng = item[lngKey] as number | null;
    if (!lat || !lng) return false;
    return lat >= zone.lat_min && lat <= zone.lat_max && lng >= zone.lng_min && lng <= zone.lng_max;
  }).length;
}

async function getWeatherMultiplier(): Promise<number> {
  const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
  if (!apiKey) return 1.0;

  try {
    const resp = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${OVERBERG_LAT}&lon=${OVERBERG_LNG}&appid=${apiKey}&units=metric`
    );
    if (!resp.ok) return 1.0;

    const data = await resp.json();
    const weatherId = data.weather?.[0]?.id || 800;
    const windSpeed = data.wind?.speed || 0;

    // Rain or thunderstorm
    if (weatherId < 600) return 1.3;
    // Heavy wind (common in Overberg)
    if (windSpeed > 15) return 1.2;
    // Drizzle/clouds
    if (weatherId < 800) return 1.1;

    return 1.0;
  } catch {
    return 1.0;
  }
}

function getEventMultiplier(): number {
  const now = new Date();
  const mmdd = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (HIGH_DEMAND_DATES.includes(mmdd)) return 1.3;

  // Weekend premium
  const day = now.getDay();
  if (day === 0 || day === 6) return 1.1;

  return 1.0;
}

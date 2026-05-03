import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const HIGH_DEMAND_DATES = [
  "12-16", "12-17", "12-18", "12-19", "12-20", "12-21", "12-22", "12-23", "12-24", "12-25",
  "12-26", "12-27", "12-28", "12-29", "12-30", "12-31", "01-01", "01-02",
  "03-21", "04-27", "05-01", "06-16", "08-09", "09-24", "12-15",
];

/**
 * Manual trigger for surge pricing calculation.
 * Same logic as the Edge Function, available as REST API for testing.
 */
export async function POST() {
  const admin = createAdminClient();

  const { data: zones } = await admin.from("surge_zones").select("*").eq("active", true);
  if (!zones || zones.length === 0) {
    return NextResponse.json({ message: "No active zones", updated: 0 });
  }

  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const [ordersRes, driversRes] = await Promise.all([
    admin.from("orders").select("delivery_latitude, delivery_longitude").gte("created_at", fifteenMinAgo).neq("status", "cancelled"),
    admin.from("drivers").select("latitude, longitude").eq("is_online", true).not("latitude", "is", null),
  ]);

  const recentOrders = (ordersRes.data || []) as { delivery_latitude: number | null; delivery_longitude: number | null }[];
  const onlineDrivers = (driversRes.data || []) as { latitude: number | null; longitude: number | null }[];

  const weatherMultiplier = await getWeatherMultiplier();
  const eventMultiplier = getEventMultiplier();
  const hour = new Date().getHours();

  const updates: { id: string; name: string; multiplier: number; reason: string }[] = [];

  for (const zone of zones as { id: string; name: string; lat_min: number; lat_max: number; lng_min: number; lng_max: number }[]) {
    const demand = recentOrders.filter((o) =>
      o.delivery_latitude && o.delivery_longitude &&
      o.delivery_latitude >= zone.lat_min && o.delivery_latitude <= zone.lat_max &&
      o.delivery_longitude >= zone.lng_min && o.delivery_longitude <= zone.lng_max
    ).length;

    const supply = onlineDrivers.filter((d) =>
      d.latitude && d.longitude &&
      d.latitude >= zone.lat_min && d.latitude <= zone.lat_max &&
      d.longitude >= zone.lng_min && d.longitude <= zone.lng_max
    ).length;

    let multiplier = 1.0;
    const reasons: string[] = [];

    if (supply === 0 && demand > 0) { multiplier += 0.8; reasons.push("no drivers"); }
    else if (supply > 0) {
      const ratio = demand / supply;
      if (ratio > 3) { multiplier += 0.7; reasons.push("high demand"); }
      else if (ratio > 2) { multiplier += 0.4; reasons.push("moderate demand"); }
      else if (ratio > 1.5) { multiplier += 0.2; reasons.push("slightly busy"); }
    }

    if (weatherMultiplier > 1.0) { multiplier += (weatherMultiplier - 1.0); reasons.push("weather"); }
    if (eventMultiplier > 1.0) { multiplier += (eventMultiplier - 1.0); reasons.push("holiday/event"); }
    if ((hour >= 12 && hour <= 13) || (hour >= 18 && hour <= 19)) { multiplier += 0.15; reasons.push("peak hour"); }

    multiplier = Math.min(2.5, Math.max(1.0, Math.round(multiplier * 100) / 100));

    await admin.from("surge_zones").update({
      multiplier,
      reason: reasons.join(", ") || "normal",
      updated_at: new Date().toISOString(),
    }).eq("id", zone.id);

    updates.push({ id: zone.id, name: zone.name, multiplier, reason: reasons.join(", ") || "normal" });
  }

  return NextResponse.json({ ok: true, updated: updates.length, zones: updates });
}

async function getWeatherMultiplier(): Promise<number> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return 1.0;

  try {
    const resp = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=-34.77&lon=20.05&appid=${apiKey}&units=metric`
    );
    if (!resp.ok) return 1.0;
    const data = await resp.json();
    const weatherId = data.weather?.[0]?.id || 800;
    const windSpeed = data.wind?.speed || 0;
    if (weatherId < 600) return 1.3;
    if (windSpeed > 15) return 1.2;
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
  const day = now.getDay();
  if (day === 0 || day === 6) return 1.1;
  return 1.0;
}

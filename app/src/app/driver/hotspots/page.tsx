"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface HotspotZone {
  id: string;
  name: string;
  multiplier: number;
  reason: string | null;
  lat_min: number;
  lat_max: number;
  lng_min: number;
  lng_max: number;
}

interface EarningsProjection {
  zone: string;
  hours: number;
  projected: number;
}

const HOUR_LABELS = ["Now", "+1h", "+2h", "+3h"];

export default function DriverHotspotsPage() {
  const [zones, setZones] = useState<HotspotZone[]>([]);
  const [projections, setProjections] = useState<EarningsProjection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getClient();
    client
      .from("surge_zones")
      .select("*")
      .eq("active", true)
      .then(({ data }) => {
        const rows = (data || []) as HotspotZone[];
        setZones(rows);

        // Generate earnings projections based on multiplier
        const projs: EarningsProjection[] = rows
          .filter((z) => z.multiplier > 1.0)
          .sort((a, b) => b.multiplier - a.multiplier)
          .slice(0, 4)
          .map((z) => ({
            zone: z.name,
            hours: 2,
            projected: Math.round(z.multiplier * 110 * 2),
          }));
        setProjections(projs);
        setLoading(false);
      });
  }, []);

  const pins = zones.map((z) => ({
    lng: (z.lng_min + z.lng_max) / 2,
    lat: (z.lat_min + z.lat_max) / 2,
    color: z.multiplier >= 1.5 ? "#E8503A" : z.multiplier >= 1.2 ? "#F5A623" : "#1E9E5A",
    emoji: z.multiplier >= 1.5 ? "🔥" : z.multiplier >= 1.2 ? "⚡" : "📍",
    label: `${z.name} · ${z.multiplier}x`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-2xl animate-pulse">🗺️</div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link href="/driver" className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0">←</Link>
        <div>
          <h1 className="font-heading font-black text-lg">Hotspot Map</h1>
          <p className="text-xs text-t2">Demand forecast · next 4 hours</p>
        </div>
      </div>

      {/* Map */}
      <div className="mx-[18px] rounded-[18px] overflow-hidden border border-bd mb-4">
        <MapView
          className="h-[260px] w-full"
          center={[20.05, -34.77]}
          zoom={11}
          pins={pins}
          interactive={true}
        />
      </div>

      {/* Surge zones */}
      <div className="px-[18px] mb-4">
        <h2 className="font-heading font-bold text-sm mb-3">Active surge zones</h2>
        {zones.length === 0 ? (
          <div className="bg-dark2 border border-bd rounded-[18px] p-6 text-center">
            <div className="text-xl mb-2">✅</div>
            <div className="text-sm text-t2">No active surges — normal pricing</div>
          </div>
        ) : (
          <div className="space-y-2">
            {zones.map((z) => (
              <div key={z.id} className="bg-dark2 border border-bd rounded-[14px] p-3.5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-heading font-black ${
                  z.multiplier >= 1.5 ? "bg-coral/10 text-coral" : z.multiplier >= 1.2 ? "bg-sun/10 text-sun" : "bg-primary/10 text-primary"
                }`}>
                  {z.multiplier}x
                </div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-sm">{z.name}</div>
                  <div className="text-[11px] text-t2 mt-0.5">{z.reason || "Normal demand"}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  z.multiplier >= 1.5 ? "bg-coral animate-pulse" : z.multiplier >= 1.2 ? "bg-sun" : "bg-primary"
                }`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earnings projections */}
      {projections.length > 0 && (
        <div className="px-[18px] mb-4">
          <h2 className="font-heading font-bold text-sm mb-3">Earnings projections</h2>
          <div className="space-y-2">
            {projections.map((p, i) => (
              <div key={i} className="bg-primary/[0.06] border border-primary/20 rounded-[14px] p-3.5 flex items-center gap-3">
                <div className="text-lg">💰</div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-sm">Move to {p.zone}</div>
                  <div className="text-[11px] text-t2 mt-0.5">Projected R{p.projected} in next {p.hours} hours</div>
                </div>
                <div className="font-heading font-black text-primary">R{p.projected}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hour-by-hour forecast */}
      <div className="px-[18px] mb-4">
        <h2 className="font-heading font-bold text-sm mb-3">Demand forecast</h2>
        <div className="flex gap-3">
          {HOUR_LABELS.map((label, i) => {
            const intensity = Math.max(0.3, 1 - i * 0.2);
            return (
              <div key={label} className="flex-1 bg-dark2 border border-bd rounded-[14px] p-3 text-center">
                <div className="text-[10px] text-t2 font-heading font-semibold mb-1">{label}</div>
                <div className="w-full h-16 bg-dark3 rounded-lg relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary/30 rounded-lg"
                    style={{ height: `${intensity * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-t2 mt-1.5 font-heading font-bold">
                  {Math.round(intensity * 10)} orders
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Link to hotspot in driver dashboard */}
      <div className="px-[18px]">
        <Link
          href="/driver"
          className="block w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-[17px] text-center active:bg-primary-dark active:scale-[0.98] transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

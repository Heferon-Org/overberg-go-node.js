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

interface KPIs {
  todayOrders: number;
  todayGmv: number;
  activeDrivers: number;
  pendingKyc: number;
  openTickets: number;
  onlineDrivers: number;
}

interface LiveOrder {
  id: string;
  order_number: string;
  status: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIs>({
    todayOrders: 0,
    todayGmv: 0,
    activeDrivers: 0,
    pendingKyc: 0,
    openTickets: 0,
    onlineDrivers: 0,
  });
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getClient();
    const today = new Date().toISOString().split("T")[0];

    async function fetchKPIs() {
      const [ordersRes, driversRes, kycRes, ticketsRes] = await Promise.all([
        client
          .from("orders")
          .select("id, total, status, delivery_latitude, delivery_longitude, order_number")
          .gte("created_at", `${today}T00:00:00`)
          .neq("status", "cancelled"),
        client.from("drivers").select("id, is_online").eq("is_online", true),
        client.from("kyc_documents").select("id").eq("verification_status", "pending"),
        client.from("support_tickets").select("id").eq("status", "open"),
      ]);

      const orders = (ordersRes.data || []) as { id: string; total: number; status: string; delivery_latitude: number | null; delivery_longitude: number | null; order_number: string }[];
      const activeOrders = orders.filter((o) =>
        ["placed", "confirmed", "preparing", "ready", "picked_up", "on_the_way"].includes(o.status)
      );

      setKpis({
        todayOrders: orders.length,
        todayGmv: orders.reduce((sum, o) => sum + o.total, 0),
        activeDrivers: activeOrders.length,
        pendingKyc: (kycRes.data || []).length,
        openTickets: (ticketsRes.data || []).length,
        onlineDrivers: (driversRes.data || []).length,
      });

      setLiveOrders(
        activeOrders
          .filter((o) => o.delivery_latitude && o.delivery_longitude)
          .map((o) => ({
            id: o.id,
            order_number: o.order_number,
            status: o.status,
            delivery_latitude: o.delivery_latitude,
            delivery_longitude: o.delivery_longitude,
          }))
      );
      setLoading(false);
    }

    fetchKPIs();

    const channel = client
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchKPIs();
      })
      .subscribe();

    return () => { client.removeChannel(channel); };
  }, []);

  const mapPins = liveOrders.map((o) => ({
    lng: o.delivery_longitude!,
    lat: o.delivery_latitude!,
    color: o.status === "on_the_way" ? "#1E9E5A" : o.status === "preparing" ? "#0E9EC2" : "#F5A623",
    emoji: o.status === "on_the_way" ? "🛵" : "📦",
    label: `#${o.order_number}`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">📊</div>
          <div className="font-heading font-bold text-sm text-[rgba(17,24,39,0.55)]">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-black text-2xl text-[#111827]">Operations Dashboard</h1>
          <p className="text-sm text-[rgba(17,24,39,0.55)] mt-0.5">Real-time overview of OverBerg Go</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1E9E5A] animate-pulse" />
          <span className="font-heading font-bold text-xs text-[#1E9E5A]">Live</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Today's orders" value={kpis.todayOrders.toString()} color="text-[#1E9E5A]" />
        <KpiCard label="GMV today" value={`R${kpis.todayGmv.toLocaleString()}`} color="text-[#1E9E5A]" />
        <KpiCard label="Active orders" value={kpis.activeDrivers.toString()} color="text-[#0E9EC2]" />
        <KpiCard label="Drivers online" value={kpis.onlineDrivers.toString()} color="text-[#0E9EC2]" />
        <KpiCard label="Pending KYC" value={kpis.pendingKyc.toString()} color="text-[#F5A623]" />
        <KpiCard label="Open tickets" value={kpis.openTickets.toString()} color="text-[#E8503A]" />
      </div>

      {/* Live Order Map */}
      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[rgba(0,0,0,0.07)] flex items-center justify-between">
          <h2 className="font-heading font-bold text-sm">Live Order Map</h2>
          <span className="text-[11px] text-[rgba(17,24,39,0.55)]">{liveOrders.length} active</span>
        </div>
        <MapView
          className="h-[320px] w-full"
          center={[20.05, -34.77]}
          zoom={12}
          pins={mapPins}
          interactive={true}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink href="/admin/orders" icon="📋" label="Manage Orders" count={kpis.todayOrders} />
        <QuickLink href="/admin/drivers" icon="🛵" label="Driver Management" count={kpis.onlineDrivers} />
        <QuickLink href="/admin/tickets" icon="🎫" label="Support Queue" count={kpis.openTickets} />
        <QuickLink href="/admin/promos" icon="🎟️" label="Promo Codes" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-4 text-center">
      <div className={`font-heading font-black text-xl ${color}`}>{value}</div>
      <div className="text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-semibold mt-1">{label}</div>
    </div>
  );
}

function QuickLink({ href, icon, label, count }: { href: string; icon: string; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-4 flex items-center gap-3 hover:border-[#1E9E5A]/30 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="font-heading font-bold text-[13px] text-[#111827]">{label}</div>
        {count !== undefined && (
          <div className="text-[11px] text-[rgba(17,24,39,0.55)]">{count} active</div>
        )}
      </div>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface DayData {
  date: string;
  orders: number;
  gmv: number;
}

interface RestaurantRevenue {
  name: string;
  revenue: number;
}

export default function AdminAnalyticsPage() {
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [topRestaurants, setTopRestaurants] = useState<RestaurantRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  async function fetchAnalytics() {
    setLoading(true);
    const client = getClient();
    const since = new Date(Date.now() - range * 86400000).toISOString();

    const { data: orders } = await client
      .from("orders")
      .select("total, created_at, restaurant_id, status")
      .gte("created_at", since)
      .neq("status", "cancelled");

    const rows = (orders || []) as { total: number; created_at: string; restaurant_id: string; status: string }[];

    // Daily aggregation
    const byDay = new Map<string, { orders: number; gmv: number }>();
    for (const o of rows) {
      const day = o.created_at.split("T")[0];
      const entry = byDay.get(day) || { orders: 0, gmv: 0 };
      entry.orders++;
      entry.gmv += o.total;
      byDay.set(day, entry);
    }

    const daily = Array.from(byDay.entries())
      .map(([date, d]) => ({ date: date.slice(5), orders: d.orders, gmv: d.gmv }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setDailyData(daily);

    // Top restaurants
    const byRestaurant = new Map<string, number>();
    for (const o of rows) {
      byRestaurant.set(o.restaurant_id, (byRestaurant.get(o.restaurant_id) || 0) + o.total);
    }

    const restaurantIds = Array.from(byRestaurant.keys());
    let restaurantNames: Record<string, string> = {};
    if (restaurantIds.length > 0) {
      const { data: rests } = await client.from("restaurants").select("id, name").in("id", restaurantIds);
      for (const r of (rests || []) as { id: string; name: string }[]) {
        restaurantNames[r.id] = r.name;
      }
    }

    const topRest = Array.from(byRestaurant.entries())
      .map(([id, revenue]) => ({ name: restaurantNames[id] || id.slice(0, 8), revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
    setTopRestaurants(topRest);

    setLoading(false);
  }

  const totalOrders = dailyData.reduce((s, d) => s + d.orders, 0);
  const totalGmv = dailyData.reduce((s, d) => s + d.gmv, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-2xl animate-pulse">📈</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading font-black text-xl text-[#111827]">Analytics</h1>
        <div className="flex gap-2">
          {[30, 90, 365].map((d) => (
            <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 rounded-xl text-[11px] font-heading font-bold border ${range === d ? "bg-[#1E9E5A] text-white border-[#1E9E5A]" : "bg-white border-[rgba(0,0,0,0.07)]"}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-4 text-center">
          <div className="font-heading font-black text-xl text-[#1E9E5A]">{totalOrders}</div>
          <div className="text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-semibold">Orders ({range}d)</div>
        </div>
        <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-4 text-center">
          <div className="font-heading font-black text-xl text-[#1E9E5A]">R{totalGmv.toLocaleString()}</div>
          <div className="text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-semibold">GMV ({range}d)</div>
        </div>
        <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-4 text-center">
          <div className="font-heading font-black text-xl">R{avgOrderValue}</div>
          <div className="text-[10px] text-[rgba(17,24,39,0.55)] font-heading font-semibold">Avg order</div>
        </div>
      </div>

      {/* Orders per day */}
      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-5 mb-5">
        <h3 className="font-heading font-bold text-sm mb-4">Orders per day</h3>
        {dailyData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-[rgba(17,24,39,0.45)]">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#1E9E5A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* GMV per day */}
      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-5 mb-5">
        <h3 className="font-heading font-bold text-sm mb-4">GMV per day (R)</h3>
        {dailyData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-[rgba(17,24,39,0.45)]">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `R${v}`} />
              <Legend />
              <Line type="monotone" dataKey="gmv" name="Revenue" stroke="#0E9EC2" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top restaurants */}
      <div className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-5">
        <h3 className="font-heading font-bold text-sm mb-4">Top Restaurants by Revenue</h3>
        {topRestaurants.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-[rgba(17,24,39,0.45)]">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topRestaurants} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={(v) => `R${v}`} />
              <Bar dataKey="revenue" fill="#1E9E5A" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

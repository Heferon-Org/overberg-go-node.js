"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Restaurant, MenuItem, Experience, Stay, Order, OrderStatus, KycDocument, SupportTicket, Payment } from "./types";

// Locally-typed wallet transaction (table not yet in Database type)
export interface WalletTx {
  id: string;
  user_id: string;
  type: "topup" | "payment" | "refund" | "cashback" | "referral" | "withdrawal" | "adjustment";
  amount: number;
  balance_after: number;
  description: string;
  reference: string | null;
  payment_id: string | null;
  order_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Use untyped client for flexibility — typed queries via cast on results
function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Check if Supabase is configured
function isConfigured() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url-here"
  );
}

// ═══════════════════════════════════════════
// RESTAURANTS
// ═══════════════════════════════════════════

export function useRestaurants(area?: string) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    let query = getClient().from("restaurants").select("*").order("rating", { ascending: false });
    if (area) query = query.eq("area", area);

    query.then(({ data }) => {
      if (data) setRestaurants(data);
      setLoading(false);
    });
  }, [area]);

  return { restaurants, loading, isLive: isConfigured() };
}

export function useRestaurant(slug: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    getClient()
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (data) setRestaurant(data);
        setLoading(false);
      });
  }, [slug]);

  return { restaurant, loading, isLive: isConfigured() };
}

// ═══════════════════════════════════════════
// MENU ITEMS
// ═══════════════════════════════════════════

export function useMenuItems(restaurantId: string | undefined) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured() || !restaurantId) {
      setLoading(false);
      return;
    }

    getClient()
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("available", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setItems(data);
        setLoading(false);
      });
  }, [restaurantId]);

  return { items, loading, isLive: isConfigured() };
}

// ═══════════════════════════════════════════
// EXPERIENCES
// ═══════════════════════════════════════════

export function useExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    getClient()
      .from("experiences")
      .select("*")
      .eq("available", true)
      .then(({ data }) => {
        if (data) setExperiences(data);
        setLoading(false);
      });
  }, []);

  return { experiences, loading, isLive: isConfigured() };
}

// ═══════════════════════════════════════════
// STAYS
// ═══════════════════════════════════════════

export function useStays() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    getClient()
      .from("stays")
      .select("*")
      .eq("available", true)
      .then(({ data }) => {
        if (data) setStays(data);
        setLoading(false);
      });
  }, []);

  return { stays, loading, isLive: isConfigured() };
}

// ═══════════════════════════════════════════
// ORDERS (with Realtime)
// ═══════════════════════════════════════════

export function useOrders(userId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured() || !userId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    getClient()
      .from("orders")
      .select("*")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
        setLoading(false);
      });

    // Realtime subscription
    const client = getClient();
    const channel = client
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [userId]);

  return { orders, loading, isLive: isConfigured() };
}

// ═══════════════════════════════════════════
// VENDOR ORDERS (with Realtime)
// ═══════════════════════════════════════════

export function useVendorOrders(restaurantId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured() || !restaurantId) {
      setLoading(false);
      return;
    }

    getClient()
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .in("status", ["placed", "confirmed", "preparing", "ready"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
        setLoading(false);
      });

    const client = getClient();
    const channel = client
      .channel("vendor-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as Order, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [restaurantId]);

  return { orders, loading, isLive: isConfigured() };
}

// ═══════════════════════════════════════════
// ORDER ACTIONS
// ═══════════════════════════════════════════

export async function createOrder(order: {
  customerId: string;
  restaurantId: string;
  items: { id: string; name: string; price: number; quantity: number; emoji: string }[];
  deliveryAddress: string;
  paymentMethod: string;
  notes?: string;
}) {
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = 35;
  const serviceFee = Math.round(subtotal * 0.05);

  const insertData = {
    customer_id: order.customerId,
    restaurant_id: order.restaurantId,
    items: order.items as unknown,
    subtotal,
    delivery_fee: deliveryFee,
    service_fee: serviceFee,
    total: subtotal + deliveryFee + serviceFee,
    delivery_address: order.deliveryAddress,
    payment_method: order.paymentMethod,
    notes: order.notes || null,
  };

  const { data, error } = await getClient()
    .from("orders")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertData as any)
    .select()
    .single();

  return { order: data, error };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "delivered") updates.delivered_at = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await getClient().from("orders").update(updates as any).eq("id", orderId);
  return { error };
}

// ═══════════════════════════════════════════
// DRIVER
// ═══════════════════════════════════════════

export async function toggleDriverOnline(driverId: string, isOnline: boolean) {
  const { error } = await getClient()
    .from("drivers")
    .update({ is_online: isOnline })
    .eq("id", driverId);
  return { error };
}

export async function updateMenuItemAvailability(itemId: string, available: boolean) {
  const { error } = await getClient()
    .from("menu_items")
    .update({ available })
    .eq("id", itemId);
  return { error };
}

// ═══════════════════════════════════════════
// KYC DOCUMENTS
// ═══════════════════════════════════════════

export function useKycDocuments(userId: string | undefined, role?: "driver" | "vendor") {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured() || !userId) {
      setLoading(false);
      return;
    }

    let query = getClient()
      .from("kyc_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (role) query = query.eq("applicant_role", role);

    query.then(({ data }) => {
      if (data) setDocuments(data);
      setLoading(false);
    });
  }, [userId, role]);

  const allApproved = documents.length > 0 && documents.every((d) => d.verification_status === "approved");
  const hasPending = documents.some((d) => d.verification_status === "pending");
  const hasRejected = documents.some((d) => d.verification_status === "rejected");

  return { documents, loading, allApproved, hasPending, hasRejected, isLive: isConfigured() };
}

// ═══════════════════════════════════════════
// SUPPORT TICKETS
// ═══════════════════════════════════════════

export function useSupportTickets(userId: string | undefined) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured() || !userId) {
      setLoading(false);
      return;
    }

    getClient()
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setTickets(data);
        setLoading(false);
      });
  }, [userId]);

  return { tickets, loading, isLive: isConfigured() };
}

export async function createSupportTicket(ticket: {
  userId: string;
  orderId?: string;
  subject: string;
  description?: string;
  category?: string;
  priority?: string;
}) {
  const insertData = {
    user_id: ticket.userId,
    order_id: ticket.orderId || null,
    subject: ticket.subject,
    description: ticket.description || null,
    category: ticket.category || "general",
    priority: ticket.priority || "normal",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await getClient().from("support_tickets").insert(insertData as any).select().single();
  return { ticket: data, error };
}

// ═══════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════

export function usePayments(userId: string | undefined) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured() || !userId) {
      setLoading(false);
      return;
    }

    getClient()
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPayments(data);
        setLoading(false);
      });
  }, [userId]);

  return { payments, loading, isLive: isConfigured() };
}

// ═══════════════════════════════════════════
// WALLET (balance + transactions, with realtime)
// ═══════════════════════════════════════════

export function useWallet(userId: string | undefined) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured() || !userId) {
      setLoading(false);
      return;
    }

    const client = getClient();

    Promise.all([
      client.from("profiles").select("wallet_balance").eq("id", userId).single(),
      client
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]).then(([profileRes, txRes]) => {
      const profileRow = profileRes.data as { wallet_balance: number } | null;
      if (profileRow) setBalance(Number(profileRow.wallet_balance));
      if (txRes.data) setTransactions(txRes.data as unknown as WalletTx[]);
      setLoading(false);
    });

    // Realtime — listen for new transactions
    const channel = client
      .channel(`wallet-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const tx = payload.new as unknown as WalletTx;
          setTransactions((prev) => [tx, ...prev]);
          setBalance(Number(tx.balance_after));
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [userId]);

  return { balance, transactions, loading, isLive: isConfigured() };
}

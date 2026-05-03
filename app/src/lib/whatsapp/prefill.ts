"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useCartStore } from "@/lib/store";

export function useWhatsAppPrefill() {
  const searchParams = useSearchParams();
  const [loaded, setLoaded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    const token = searchParams.get("prefill");
    if (!token || loaded) return;

    async function loadPrefill() {
      const client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data } = await client
        .from("whatsapp_conversations")
        .select("cart_draft, token_used")
        .eq("prefill_token", token)
        .single();

      const row = data as { cart_draft: { name: string; price: number; quantity: number }[]; token_used: boolean } | null;
      if (!row || row.token_used) {
        setLoaded(true);
        return;
      }

      clearCart();
      for (const item of row.cart_draft || []) {
        for (let i = 0; i < item.quantity; i++) {
          addItem({
            id: crypto.randomUUID(),
            name: item.name,
            price: item.price,
            emoji: "🍽️",
            restaurantId: "harbour-cafe",
            restaurantName: "Harbour Café",
          });
        }
      }

      await client
        .from("whatsapp_conversations")
        .update({ token_used: true })
        .eq("prefill_token", token);

      setLoaded(true);
    }

    loadPrefill();
  }, [searchParams, loaded, addItem, clearCart]);

  return loaded;
}

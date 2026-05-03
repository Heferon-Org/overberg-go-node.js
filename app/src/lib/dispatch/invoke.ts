/**
 * Server-side helper to invoke the `dispatch-order` Supabase Edge Function.
 * Call this immediately after marking an order `confirmed`.
 */
export async function invokeDispatch(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.DISPATCH_SECRET;

  if (!url || !key) {
    return { ok: false, error: "supabase env missing" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  if (secret) headers["x-dispatch-secret"] = secret;

  try {
    const res = await fetch(`${url}/functions/v1/dispatch-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ order_id: orderId }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `dispatch fn ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

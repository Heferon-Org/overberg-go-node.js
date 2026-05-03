import { createClient } from "@supabase/supabase-js";

/**
 * Service-role admin client. Server-side only — bypasses RLS.
 * Use only inside webhook handlers and trusted server routes.
 *
 * Untyped on purpose — server routes cast results as needed.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    throw new Error("Supabase admin client missing env vars");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

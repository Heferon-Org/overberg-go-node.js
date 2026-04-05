"use client";

import { AuthProvider } from "@/lib/supabase/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  // Only wrap with AuthProvider if Supabase is configured
  const isConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url-here";

  if (!isConfigured) {
    return <>{children}</>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}

"use client";

import { AuthProvider } from "@/lib/supabase/auth";
import { I18nProvider } from "@/i18n/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const isConfigured =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url-here";

  const content = isConfigured ? <AuthProvider>{children}</AuthProvider> : <>{children}</>;

  return <I18nProvider>{content}</I18nProvider>;
}

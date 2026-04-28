"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store";

const tabs = [
  { href: "/", label: "Home", icon: "🏠", id: "home" },
  { href: "/food", label: "Food", icon: "🍽️", id: "food" },
  { href: "/explore", label: "Explore", icon: "⚓", id: "explore" },
  { href: "/orders", label: "Orders", icon: "📦", id: "orders", dot: true },
  { href: "/profile", label: "Me", icon: "👤", id: "me" },
];

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.count);

  // Hide bottom nav on driver/vendor dashboards and auth/cart
  if (
    pathname.startsWith("/driver") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/cart")
  ) {
    return null;
  }

  const getActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const count = cartCount();

  return (
    <>
      {/* Floating cart badge */}
      {count > 0 && (
        <Link
          href="/cart"
          className="fixed bottom-[88px] right-4 z-50 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform"
        >
          <span className="text-2xl">🛒</span>
          <span className="absolute -top-1 -right-1 bg-coral text-white text-[10px] font-heading font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
            {count}
          </span>
        </Link>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/96 backdrop-blur-xl border-t border-bd shadow-[0_-1px_3px_rgba(0,0,0,0.06)] flex justify-around px-1 pt-3 pb-7 z-50">
        {tabs.map((tab) => {
          const active = getActive(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center gap-1 flex-1 relative transition-colors ${
                active ? "text-primary" : "text-t3"
              }`}
            >
              {active && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-[3px] bg-primary rounded-full" />
              )}
              <span className="text-xl leading-none relative">
                {tab.icon}
                {tab.dot && (
                  <span className="absolute -top-0.5 -right-1.5 w-2 h-2 bg-coral rounded-full border-2 border-white" />
                )}
              </span>
              <span className="font-heading text-[10px] font-semibold">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

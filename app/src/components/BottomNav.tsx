"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "🏠", id: "home" },
  { href: "/food", label: "Food", icon: "🍽️", id: "food" },
  { href: "/explore", label: "Explore", icon: "⚓", id: "explore" },
  { href: "/orders", label: "Orders", icon: "📦", id: "orders", dot: true },
  { href: "/profile", label: "Me", icon: "👤", id: "me" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on driver/vendor dashboards
  if (pathname.startsWith("/driver") || pathname.startsWith("/vendor")) {
    return null;
  }

  const getActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark/96 backdrop-blur-xl border-t border-bd flex justify-around px-1 pt-3 pb-7 z-50">
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
                <span className="absolute -top-0.5 -right-1.5 w-2 h-2 bg-coral rounded-full border-2 border-dark" />
              )}
            </span>
            <span className="font-heading text-[10px] font-semibold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

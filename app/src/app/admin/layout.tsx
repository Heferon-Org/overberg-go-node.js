"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📋" },
  { href: "/admin/drivers", label: "Drivers", icon: "🛵" },
  { href: "/admin/merchants", label: "Merchants", icon: "🏪" },
  { href: "/admin/payouts", label: "Payouts", icon: "💳" },
  { href: "/admin/promos", label: "Promos", icon: "🎟️" },
  { href: "/admin/tickets", label: "Tickets", icon: "🎫" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-[#f7f8fa]">
      <aside className="hidden md:flex flex-col w-[220px] bg-[#111827] text-white shrink-0 fixed h-dvh overflow-y-auto">
        <div className="px-5 pt-5 pb-3">
          <Link href="/" className="font-heading font-black text-lg text-primary">
            OverBerg Go
          </Link>
          <div className="text-[10px] text-white/40 mt-0.5">Admin Console</div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-heading font-semibold transition-colors ${
                  active ? "bg-primary text-white" : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <Link href="/" className="text-[11px] text-white/40 hover:text-white/70">
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111827] px-4 py-3 flex items-center gap-3 overflow-x-auto">
        <Link href="/" className="font-heading font-black text-sm text-primary shrink-0">OBG</Link>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-heading font-semibold whitespace-nowrap ${
                active ? "bg-primary text-white" : "text-white/50"
              }`}
            >
              {item.icon} {item.label}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 md:ml-[220px] pt-14 md:pt-0 pb-8">
        {children}
      </main>
    </div>
  );
}

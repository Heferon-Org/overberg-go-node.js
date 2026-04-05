"use client";

import Link from "next/link";

const notifications = [
  {
    id: "1",
    type: "order",
    title: "Order on the way!",
    message: "Your Harbour Café order is being delivered by Sipho. ETA 12 min.",
    time: "2 min ago",
    emoji: "🛵",
    unread: true,
  },
  {
    id: "2",
    type: "promo",
    title: "Weekend Special: 20% off sea trips",
    message: "Use code SEA20 for boat experiences this weekend.",
    time: "1 hour ago",
    emoji: "⛵",
    unread: true,
  },
  {
    id: "3",
    type: "order",
    title: "Rate your experience",
    message: "How was your order from Fish & More yesterday?",
    time: "Yesterday",
    emoji: "⭐",
    unread: false,
  },
  {
    id: "4",
    type: "promo",
    title: "PnP Smart Deal: R50 off",
    message: "Spend R300+ on groceries and save R50. Code PNPSAVE.",
    time: "Yesterday",
    emoji: "🛒",
    unread: false,
  },
  {
    id: "5",
    type: "system",
    title: "Welcome to OverBerg Go!",
    message: "Start exploring food, rides, and experiences in the Overberg.",
    time: "3 days ago",
    emoji: "🌿",
    unread: false,
  },
  {
    id: "6",
    type: "promo",
    title: "New: Dog Walker service",
    message: "Beach dog walking now available. Book morning or afternoon slots.",
    time: "4 days ago",
    emoji: "🐕",
    unread: false,
  },
  {
    id: "7",
    type: "system",
    title: "Earn R50: Refer a friend",
    message: "Share OverBerg Go with friends and earn R50 for each signup.",
    time: "1 week ago",
    emoji: "🎁",
    unread: false,
  },
];

export default function NotificationsPage() {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div>
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-4">
        <Link
          href="/"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <div className="flex-1">
          <h1 className="font-heading font-black text-lg">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-primary font-heading font-semibold">{unreadCount} unread</p>
          )}
        </div>
        <button className="text-xs text-primary font-heading font-bold">Mark all read</button>
      </div>

      <div className="pb-24">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`flex gap-3 px-[18px] py-3.5 border-b border-bd ${
              notif.unread ? "bg-primary/[0.03]" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-xl shrink-0">
              {notif.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="font-heading font-bold text-sm flex-1">{notif.title}</div>
                {notif.unread && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-t2 mt-0.5 leading-relaxed">{notif.message}</p>
              <span className="text-[10px] text-t3 mt-1 block">{notif.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

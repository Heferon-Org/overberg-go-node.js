"use client";

import Link from "next/link";
import type { Restaurant } from "@/lib/data";
import { useFavoritesStore } from "@/lib/store";

export function RestaurantCard({ r }: { r: Restaurant }) {
  const isFav = useFavoritesStore((s) => s.isRestaurantFav(r.id));
  const toggleFav = useFavoritesStore((s) => s.toggleRestaurant);

  const content = (
    <div
      className={`bg-dark2 border border-bd rounded-[18px] overflow-hidden shadow-sm transition-all active:scale-[0.99] ${
        r.closed ? "opacity-60" : ""
      }`}
    >
      <div className="h-[120px] relative overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center text-[56px]"
          style={{ background: r.bg }}
        >
          {r.emoji}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.55)] via-[rgba(0,0,0,0.05)] to-transparent" />
        {r.closed && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-5">
            <div className="bg-black/80 text-white/70 font-bold text-[11px] px-4 py-1.5 rounded-full border border-white/15">
              {r.closedTime}
            </div>
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-lg border border-white/[0.13] rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white flex items-center gap-1">
          ★ {r.rating}
          {r.reviews > 0 && <span className="text-white/50">({r.reviews})</span>}
        </div>
        <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-lg border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white/90">
          {r.tag}
        </div>
        {!r.closed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFav(r.id);
            }}
            className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-sm shadow-sm active:scale-90 transition-transform"
          >
            {isFav ? "❤️" : "🤍"}
          </button>
        )}
      </div>
      <div className="p-3 pb-3.5">
        <div className="font-heading font-bold text-sm text-t1">{r.name}</div>
        {r.subtitle && (
          <div className="text-[11px] text-t2 mt-1 leading-relaxed">{r.subtitle}</div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-t2 mt-1.5">
          <span>🕐 {r.time}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-black/15" />
          <span>{r.deliveryFee} delivery</span>
          {r.location && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-black/15" />
              <span>{r.location}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (r.closed) return <div className="mb-3">{content}</div>;

  return (
    <Link href={`/food/${r.id}`} className="block mb-3">
      {content}
    </Link>
  );
}

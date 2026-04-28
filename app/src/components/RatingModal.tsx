"use client";

import { useState } from "react";
import { useToastStore } from "@/lib/store";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  restaurantName: string;
  driverName: string;
}

export function RatingModal({ open, onClose, restaurantName, driverName }: RatingModalProps) {
  const [foodRating, setFoodRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tip, setTip] = useState<number | null>(null);
  const showToast = useToastStore((s) => s.show);

  if (!open) return null;

  const handleSubmit = () => {
    showToast("✓ Thanks for your feedback!");
    onClose();
    setFoodRating(0);
    setDriverRating(0);
    setComment("");
    setTip(null);
  };

  const StarRow = ({
    rating,
    onRate,
    label,
  }: {
    rating: number;
    onRate: (n: number) => void;
    label: string;
  }) => (
    <div className="mb-4">
      <div className="font-heading font-bold text-xs text-t2 mb-2">{label}</div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onRate(n)}
            className="w-11 h-11 rounded-xl bg-dark3 border border-bd flex items-center justify-center text-xl active:scale-90 transition-transform"
          >
            {n <= rating ? "⭐" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white border-t border-bd rounded-t-3xl w-full max-w-lg p-6 pb-10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-5" />
        <div className="text-center mb-5">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="font-heading font-black text-lg">How was your order?</h2>
          <p className="text-[11px] text-t2 mt-1">Rate your experience with {restaurantName}</p>
        </div>

        <StarRow rating={foodRating} onRate={setFoodRating} label="Food quality" />
        <StarRow rating={driverRating} onRate={setDriverRating} label={`Delivery by ${driverName}`} />

        <div className="mb-4">
          <div className="font-heading font-bold text-xs text-t2 mb-2">Add a comment (optional)</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you enjoy? Any feedback?"
            rows={2}
            className="w-full bg-dark3 border border-bd rounded-xl px-3 py-2.5 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors resize-none"
          />
        </div>

        {/* Tip */}
        <div className="mb-5">
          <div className="font-heading font-bold text-xs text-t2 mb-2">Leave a tip for {driverName}</div>
          <div className="flex gap-2">
            {[0, 5, 10, 20].map((t) => (
              <button
                key={t}
                onClick={() => setTip(t)}
                className={`flex-1 py-2.5 rounded-xl font-heading font-bold text-sm border transition-all ${
                  tip === t
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-dark3 border-bd text-t2"
                }`}
              >
                {t === 0 ? "None" : `R${t}`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-white font-heading font-extrabold text-base rounded-2xl py-4 active:bg-primary-dark active:scale-[0.98] transition-all"
        >
          Submit Review
        </button>
      </div>
    </div>
  );
}

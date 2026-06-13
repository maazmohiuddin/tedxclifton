"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/**
 * Star rating — interactive when `onChange` is provided, otherwise read-only.
 */
export function StarRating({
  value,
  onChange,
  size = 22,
  className = "",
}: {
  value: number | null;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const readOnly = !onChange;
  const active = hover ?? value ?? 0;

  if (readOnly) {
    return (
      <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`Rated ${value ?? 0} out of 5`}>
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            size={size}
            aria-hidden="true"
            className={n <= (value ?? 0) ? "text-[#FFD06B]" : "text-white/15"}
            fill={n <= (value ?? 0) ? "#FFD06B" : "transparent"}
            strokeWidth={1.75}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role="radiogroup"
      aria-label="Star rating"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="p-0.5 transition-transform duration-150 hover:scale-110 active:scale-95"
        >
          <Star
            size={size}
            aria-hidden="true"
            className={n <= active ? "text-[#FFD06B]" : "text-white/25"}
            fill={n <= active ? "#FFD06B" : "transparent"}
            strokeWidth={1.75}
          />
        </button>
      ))}
    </div>
  );
}

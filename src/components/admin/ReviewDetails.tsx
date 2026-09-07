'use client';

import type { ReviewRatings } from '@/types';
import { RATING_LABELS } from '@/types';

interface ReviewDetailsProps {
  ratings: ReviewRatings;
}

export function ReviewDetails({ ratings }: ReviewDetailsProps) {
  const keys = Object.keys(RATING_LABELS) as (keyof ReviewRatings)[];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      {keys.map((key) => {
        const value = ratings[key];
        return (
          <div
            key={key}
            className="flex items-center justify-between gap-1.5 rounded-xl bg-[var(--color-surface-warm)] border border-[var(--color-border)] px-2 py-1.5"
          >
            <span className="text-xs truncate text-[var(--color-text-secondary)]">
              {RATING_LABELS[key].icon} {RATING_LABELS[key].ar}
            </span>
            <span className="shrink-0 text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-1.5 py-0.5">
              {value}/5
            </span>
          </div>
        );
      })}
    </div>
  );
}
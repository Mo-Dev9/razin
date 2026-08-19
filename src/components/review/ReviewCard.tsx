'use client';

import type { Review, ReviewRatings } from '@/types';
import { RATING_LABELS } from '@/types';
import { formatDate } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-light)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
            {review.overall}
          </div>
          <div>
            <div className="text-xs font-medium">مقيّم مجهول</div>
            <div className="text-[10px] text-[var(--color-text-secondary)]">{formatDate(review.createdAt)}</div>
          </div>
        </div>
        {(review.floor || review.apartmentNumber) && (
          <div className="text-[10px] text-[var(--color-primary)] font-medium">
            {[review.floor && `دور ${review.floor}`, review.apartmentNumber && `شقة ${review.apartmentNumber}`].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {Object.entries(review.ratings).map(([key, value]) => {
          const label = RATING_LABELS[key as keyof ReviewRatings];
          return (
            <div key={key} className="text-center">
              <span className="text-xs">{label.icon}</span>
              <div className="text-[10px] text-[var(--color-text-secondary)]">{value}/5</div>
            </div>
          );
        })}
      </div>

      {review.comment && (
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}

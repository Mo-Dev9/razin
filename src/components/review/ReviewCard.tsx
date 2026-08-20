import type { Review } from '@/types';
import { RATING_LABELS } from '@/types';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const keys = Object.keys(RATING_LABELS) as (keyof typeof RATING_LABELS)[];
  const vals = keys.map((k) => review.ratings[k]).filter((v): v is number => v != null);
  const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  const hasAvg = vals.length > 0;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">مساهم في الحي</span>
          <span className="text-xs text-[var(--color-text-muted)]">·</span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {review.createdAt ? new Date(review.createdAt).getFullYear() : '—'}
          </span>
        </div>
        {hasAvg && (
          <div className="flex items-center gap-1 bg-[var(--color-accent)]/15 px-2.5 py-1 rounded-lg">
            <span className="text-sm font-bold text-[var(--color-primary)]">{avg}</span>
            <span className="text-[var(--color-accent)] text-xs">★</span>
          </div>
        )}
      </div>

      {review.comment && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic">
          «{review.comment}»
        </p>
      )}
    </div>
  );
}

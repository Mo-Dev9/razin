import type { Review } from '@/types';
import { RATING_LABELS } from '@/types';

interface BuildingRatingsProps {
  reviews: Review[];
}

export function BuildingRatings({ reviews }: BuildingRatingsProps) {
  const keys = Object.keys(RATING_LABELS) as (keyof typeof RATING_LABELS)[];

  if (!reviews.length) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        لسه مفيش تقييمات ترسم الصورة دي — أول تقييم هيكشف تفاصيل الحياة اليومية هنا.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      {keys.map((key) => {
        const vals = reviews.map((r) => r.ratings[key]).filter((v): v is number => v != null);
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        const pct = Math.round((avg / 5) * 100);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-secondary)] w-16 sm:w-20 flex-shrink-0 truncate">
              {RATING_LABELS[key].ar}
            </span>
            <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-[var(--color-primary)] w-9 text-left flex-shrink-0">
              {vals.length ? avg.toFixed(1) : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
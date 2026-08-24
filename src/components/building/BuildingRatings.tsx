import type { Review } from '@/types';
import { RATING_LABELS } from '@/types';

interface BuildingRatingsProps {
  reviews: Review[];
}

const RATING_ICONS: Record<string, string> = {
  zahma: '🚗',
  humidity: '💧',
  landlord: '🤝',
  neighbors: '👥',
  cleanliness: '🧹',
  safety: '🛡️',
  services: '🏪',
  annoyance: '🔊',
  elevator: '🛗',
  maintenance: '🔧',
  ac: '❄️',
};

export function BuildingRatings({ reviews }: BuildingRatingsProps) {
  if (!reviews.length) return null;

  const keys = Object.keys(RATING_LABELS) as (keyof typeof RATING_LABELS)[];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {keys.map((key) => {
        const vals = reviews.map((r) => r.ratings[key]).filter((v): v is number => v != null);
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        return (
          <div key={key} className="bg-[var(--color-surface-warm)] rounded-2xl p-4 text-center hover:shadow-soft hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center mx-auto">
              <span className="text-lg">{RATING_ICONS[key] || '⭐'}</span>
            </div>
            <div className="text-lg font-bold text-[var(--color-primary)] mt-1">{avg.toFixed(1)}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{RATING_LABELS[key].ar}</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">{vals.length} تقييم</div>
          </div>
        );
      })}
    </div>
  );
}

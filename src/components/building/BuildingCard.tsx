import Link from 'next/link';
import type { Building } from '@/types';
import { ratingSummaryText, ratingScaleText } from '@/lib/rating-text';

interface BuildingCardProps {
  building: Building;
  ratingAvg?: number;
  reviewCount?: number;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function BuildingCard({ building, ratingAvg = 0, reviewCount = 0, isSaved = false, onToggleSave }: BuildingCardProps) {
  return (
    <div className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft hover:shadow-[0_10px_30px_-5px_rgb(15_44_44/0.15)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02]">
      {onToggleSave && (
        <button
          type="button"
          onClick={onToggleSave}
          title={isSaved ? 'إزالة من المحفوظات' : 'احفظ المبنى'}
          className={`absolute left-3 top-3 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            isSaved
              ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/50 text-[var(--color-accent-dark)]'
              : 'bg-[var(--color-surface-warm)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
          }`}
        >
          {isSaved ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          )}
        </button>
      )}

      <Link
        href={`/building/${building.id}`}
        className="block"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-[var(--color-text)] text-base group-hover:text-[var(--color-primary)] transition-colors">
              {building.address || 'بلا عنوان'}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {building.city} {building.district ? `· ${building.district}` : ''}
            </p>
          </div>
          {ratingAvg > 0 && (
            <div className="flex items-center gap-1 bg-[var(--color-accent)]/15 px-3 py-1.5 rounded-xl flex-shrink-0 group-hover:scale-105">
              <span className="text-lg font-bold text-[var(--color-primary)]">{ratingAvg.toFixed(1)}</span>
              <span className="text-xs text-[var(--color-accent)]">من 5 ★</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] pr-1">
          <span className="inline-flex items-center gap-1.5">
            {ratingSummaryText(reviewCount)}
            {reviewCount > 0 && (
              <span className="text-[var(--color-text-muted)]/80">{ratingScaleText(ratingAvg)}</span>
            )}
          </span>
          {building.district && <span>{building.district}</span>}
        </div>
      </Link>
    </div>
  );
}
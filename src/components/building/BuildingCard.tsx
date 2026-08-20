import Link from 'next/link';
import type { Building } from '@/types';

interface BuildingCardProps {
  building: Building;
  ratingAvg?: number;
  reviewCount?: number;
}

export function BuildingCard({ building, ratingAvg = 0, reviewCount = 0 }: BuildingCardProps) {
  return (
    <Link
      href={`/building/${building.id}`}
      className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft hover:shadow-[0_10px_30px_-5px_rgb(15_44_44/0.15)] transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02]"
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
            <span className="text-[var(--color-accent)]">★</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span>{reviewCount} تقييم</span>
        {building.district && <span>{building.district}</span>}
      </div>
    </Link>
  );
}

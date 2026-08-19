import type { Building } from '@/types';
import { Card } from '@/components/ui/Card';
import { ratingToLabel } from '@/lib/utils';

interface BuildingCardProps {
  building: Building;
}

export function BuildingCard({ building }: BuildingCardProps) {
  const avg = building.averageRatings.overall;
  const label = ratingToLabel(avg);
  const details = [building.buildingNumber && `عمارة ${building.buildingNumber}`, building.floor && `دور ${building.floor}`, building.apartmentNumber && `شقة ${building.apartmentNumber}`].filter(Boolean).join(' · ');

  return (
    <Card href={`/building/${building.id}`} className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{building.address}</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {building.area}، {building.city}
          </p>
          {details && (
            <p className="text-[10px] text-[var(--color-primary)] mt-1 font-medium">{details}</p>
          )}
        </div>
        <div className="flex flex-col items-center mr-4">
          <div className="text-2xl font-bold text-[var(--color-primary)]">
            {avg.toFixed(1)}
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)]">{label}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-secondary)]">
          {building.reviewCount} تقييم
        </span>
        <div className="flex gap-1">
          {Object.entries(building.averageRatings)
            .filter(([k]) => k !== 'overall')
            .slice(0, 3)
            .map(([, val]) => (
              <span
                key={val}
                className={`inline-block w-2 h-2 rounded-full ${
                  val >= 4 ? 'bg-[var(--color-success)]' : val >= 2.5 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-error)]'
                }`}
              />
            ))}
        </div>
      </div>
    </Card>
  );
}

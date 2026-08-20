'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BuildingRatings } from '@/components/building/BuildingRatings';
import { ReviewCard } from '@/components/review/ReviewCard';
import { useBuildings } from '@/hooks/useBuildings';
import { useReviews } from '@/hooks/useReviews';
import type { Building, Review } from '@/types';

interface BuildingPageInnerProps {
  buildingId: string;
}

export default function BuildingPageInner({ buildingId }: BuildingPageInnerProps) {
  const router = useRouter();
  const { getBuilding } = useBuildings();
  const { getBuildingReviews } = useReviews();

  const [building, setBuilding] = useState<Building | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (buildingId) {
      Promise.all([getBuilding(buildingId), getBuildingReviews(buildingId)]).then(([b, r]) => {
        setBuilding(b);
        setReviews(r);
        setLoading(false);
      });
    }
  }, [buildingId, getBuilding, getBuildingReviews]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1"><LoadingSpinner /></main>
      </>
    );
  }

  if (!building) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="font-semibold mb-2">المبنى غير موجود</h3>
            <Button variant="ghost" onClick={() => router.back()}>رجوع</Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ← رجوع
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{building.address}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {building.area}، {building.city}
            </p>
            {(building.buildingNumber || building.floor || building.apartmentNumber) && (
              <p className="text-xs text-[var(--color-primary)] mt-2 font-medium">
                {[building.buildingNumber && `عمارة ${building.buildingNumber}`, building.floor && `دور ${building.floor}`, building.apartmentNumber && `شقة ${building.apartmentNumber}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-accent)]/15 rounded-2xl px-5 py-3 text-center">
              <div className="text-3xl font-bold text-[var(--color-primary)]">
                {building.averageRatings.overall.toFixed(1)}
              </div>
              <div className="flex gap-0.5 justify-center mt-1">
                {Array.from({ length: Math.round(building.averageRatings.overall) }).map((_, j) => (
                  <span key={j} className="text-[var(--color-accent)] text-xs">★</span>
                ))}
              </div>
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {building.reviewCount} تقييم
            </div>
          </div>
        </div>

        <Card className="p-5 mb-6">
          <h2 className="font-semibold mb-4 text-sm">تفاصيل التقييمات</h2>
          <BuildingRatings reviews={reviews} />
        </Card>

        <Button
          className="w-full mb-6"
          size="lg"
          onClick={() => router.push(`/rate/${building.id}`)}
        >
          قيّم هذا المبنى
        </Button>

        <h2 className="font-semibold mb-4 text-sm">التقييمات</h2>
        {reviews.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--color-border)] rounded-3xl p-10 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-semibold mb-2">لا توجد تقييمات بعد</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              كن أول من يقيّم هذا المبنى!
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

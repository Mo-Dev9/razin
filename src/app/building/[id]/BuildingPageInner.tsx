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
import { useAuth } from '@/hooks/useAuth';
import type { Building, Review } from '@/types';

interface BuildingPageInnerProps {
  buildingId: string;
}

function ReviewActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        onClick={onEdit}
        className="text-xs font-medium text-[var(--color-primary)] hover:underline underline-offset-4"
      >
        تعديل
      </button>
      <button
        onClick={async () => {
          if (busy) return;
          if (!window.confirm('متأكد إنك عايز تحذف تقييمك نهائياً؟')) return;
          setBusy(true);
          await onDelete();
          setBusy(false);
        }}
        className="text-xs font-medium text-red-600 hover:underline underline-offset-4"
      >
        {busy ? '...' : 'حذف'}
      </button>
    </div>
  );
}

export default function BuildingPageInner({ buildingId }: BuildingPageInnerProps) {
  const router = useRouter();
  const { getBuilding } = useBuildings();
  const { getBuildingReviews, deleteReview } = useReviews();
  const { user } = useAuth();

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

        <button
          onClick={() => router.push(`/rate/${building.id}`)}
          className="w-full mb-6 bg-[var(--color-primary)] text-white py-[18px] rounded-full text-sm font-bold hover:bg-[var(--color-primary-dark)] hover:shadow-[0_10px_25px_-5px_rgb(15_44_44/0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          قيّم هذا المبنى
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 10 20 15 15 20" />
            <path d="M4 4v7a4 4 0 0 0 4 4h12" />
          </svg>
        </button>

        <h2 className="font-semibold mb-4 text-sm">التقييمات</h2>
        {reviews.length === 0 ? (
          <div className="border-2 border-dashed border-[var(--color-border)] rounded-3xl p-10 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-semibold mb-2">ما فيش تقييمات بعد</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              كن أول من يقيّم هذا المبنى
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            {reviews.map((review) => {
              const isMine = !!user && review.userId === user.uid;
              return (
                <div key={review.id}>
                  <ReviewCard review={review} />
                  {isMine && (
                    <ReviewActions
                      onEdit={() => router.push(`/rate/${building.id}?edit=1`)}
                      onDelete={async () => {
                        const res = await deleteReview(buildingId);
                        if (res.ok) {
                          const [b, r] = await Promise.all([getBuilding(buildingId), getBuildingReviews(buildingId)]);
                          setBuilding(b);
                          setReviews(r);
                        } else {
                          window.alert(res.error || 'فشل حذف التقييم');
                        }
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

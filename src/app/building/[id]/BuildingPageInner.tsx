'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BuildingRatings } from '@/components/building/BuildingRatings';
import { ReviewCard } from '@/components/review/ReviewCard';
import { ReportModal } from '@/components/review/ReportModal';
import { useBuildings } from '@/hooks/useBuildings';
import { useReviews } from '@/hooks/useReviews';
import { useReports } from '@/hooks/useReports';
import { useSavedBuildings } from '@/hooks/useSaves';
import { useAuth } from '@/hooks/useAuth';
import { ratingSummaryText } from '@/lib/rating-text';
import type { Building, Review, VoteType, ReportReason } from '@/types';

const BuildingMap = dynamic(() => import('@/components/map/BuildingMap').then((m) => m.BuildingMap), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-2xl border border-[var(--color-border)] flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
      جاري تحميل الخريطة...
    </div>
  ),
});

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
  const { getBuildingReviews, deleteReview, getBuildingUserVotes, voteReview } = useReviews();
  const { submitReport } = useReports();
  const { user } = useAuth();
  const { toggleSave, isSaved } = useSavedBuildings(user?.uid);

  const [building, setBuilding] = useState<Building | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, VoteType>>({});
  const [reportFor, setReportFor] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (buildingId && user) {
      Promise.all([getBuilding(buildingId), getBuildingReviews(buildingId), getBuildingUserVotes(buildingId, user.uid)]).then(([b, r, v]) => {
        setBuilding(b);
        setReviews(r);
        setUserVotes(v);
        setLoading(false);
      });
    } else if (buildingId) {
      Promise.all([getBuilding(buildingId), getBuildingReviews(buildingId)]).then(([b, r]) => {
        setBuilding(b);
        setReviews(r);
        setLoading(false);
      });
    }
  }, [buildingId, user, getBuilding, getBuildingReviews, getBuildingUserVotes]);

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
                {building.averageRatings.overall.toFixed(1)} <span className="text-sm font-medium text-[var(--color-text-muted)]">من 5</span>
              </div>
              <div className="flex gap-0.5 justify-center mt-1">
                {Array.from({ length: Math.round(building.averageRatings.overall) }).map((_, j) => (
                  <span key={j} className="text-[var(--color-accent)] text-xs">★</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start gap-2">
              <div className="text-sm text-[var(--color-text-secondary)]">
                بناءً على {ratingSummaryText(building.reviewCount)}
              </div>
              {user && (
                <button
                  type="button"
                  onClick={() => void toggleSave(building)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border transition-all ${
                    isSaved(building.id)
                      ? 'bg-[var(--color-accent)]/15 border-[var(--color-accent)]/40 text-[var(--color-accent-dark)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  {isSaved(building.id) ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      محفوظ
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      احفظ المبنى
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {building.location && (
          <div className="mb-6">
            <h2 className="font-semibold mb-3 text-sm">موقع المبنى</h2>
            <BuildingMap location={building.location} />
          </div>
        )}

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
                  <ReviewCard
                    review={review}
                    buildingId={building.id}
                    userVote={userVotes[review.id] ?? null}
                    onVote={async (reviewId, type) => {
                      if (!user) return { ok: false, error: 'غير مصرح' };
                      const res = await voteReview(reviewId, building.id, type);
                      if (res.ok) {
                        const v = await getBuildingUserVotes(building.id, user.uid);
                        setUserVotes(v);
                      }
                      return res;
                    }}
                    onReport={!isMine && !!user ? () => setReportFor(review) : undefined}
                  />
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

      {reportFor && (
        <ReportModal
          address={building.address}
          onClose={() => setReportFor(null)}
          onSubmit={(reason: ReportReason) => submitReport(reportFor.id, building.id, reason)}
        />
      )}
    </>
  );
}

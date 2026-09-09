'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { LoginPromptModal } from '@/components/auth/LoginPromptModal';
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

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent-dark)] mb-2">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
      {children}
    </div>
  );
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
  const [showLogin, setShowLogin] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ reviewId: string; type: VoteType } | null>(null);
  const [pendingReport, setPendingReport] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  const needsGoogle = () => !user || user.isAnonymous;

  const performVote = useCallback(async (reviewId: string, type: VoteType) => {
    if (!building || !user) return { ok: false, error: 'غير مصرح' };
    const res = await voteReview(reviewId, building.id, type);
    if (res.ok) {
      const v = await getBuildingUserVotes(building.id, user.uid);
      setUserVotes(v);
    }
    return res;
  }, [building, user, voteReview, getBuildingUserVotes]);

  const handleLoginDone = () => {
    setShowLogin(false);
    if (pendingVote) {
      const vote = pendingVote;
      setPendingVote(null);
      void performVote(vote.reviewId, vote.type);
    }
    if (pendingReport) {
      setPendingReport(null);
      setReportFor(pendingReport);
    }
  };

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
      <main className="flex-1 mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ← رجوع
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {building.area}، {building.city}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--color-accent-dark)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                مجهول الهوية
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] leading-tight mb-2">
              {building.address}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">
              تجارب سكان حقيقية تساعدك تشوف الحياة اليومية في المكان.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void toggleSave(building)}
                className={`inline-flex items-center gap-2 text-sm font-medium rounded-full px-5 py-3 border transition-all ${
                  isSaved(building.id)
                    ? 'bg-[var(--color-accent)]/15 border-[var(--color-accent)]/40 text-[var(--color-accent-dark)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-sm'
                }`}
              >
                {isSaved(building.id) ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    محفوظ في حسابك
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    احفظ المبنى
                  </>
                )}
              </button>

              <button
                onClick={() => router.push(`/rate/${building.id}`)}
                className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-[var(--color-primary-dark)] hover:shadow-[0_10px_25px_-5px_rgb(15_44_44/0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z"/></svg>
                قيم هذا المبنى
              </button>
            </div>
          </div>

          <div className="bg-[#0F2C2C] rounded-3xl px-8 py-6 text-center lg:w-64 flex-shrink-0 shadow-soft">
            <div className="text-xs text-[#94B4B0] font-medium mb-1">التقييم العام</div>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-5xl font-bold text-[#E9B94A]">
                {building.averageRatings.overall.toFixed(1)}
              </span>
              <span className="text-sm text-[#94B4B0]">من 5</span>
            </div>
            <div className="flex gap-1 justify-center mt-2 text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i < Math.round(building.averageRatings.overall) ? 'text-[#E9B94A]' : 'text-[#94B4B0]'}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="text-xs text-[#94B4B0] mt-2">
              {ratingSummaryText(building.reviewCount)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6 lg:order-2">
            <section>
              <SectionEyebrow>الصورة الكاملة</SectionEyebrow>
              <Card className="p-5">
                <h2 className="font-semibold mb-4 text-sm">تفاصيل الحياة اليومية</h2>
                <BuildingRatings reviews={reviews} />
              </Card>
            </section>

            {building.location && (
              <section>
                <SectionEyebrow>حددنا مكانه بدقة</SectionEyebrow>
                <BuildingMap location={building.location} />
              </section>
            )}
          </div>

          <div className="lg:col-span-3 lg:order-1">
            <section>
              <SectionEyebrow>أصوات السكان</SectionEyebrow>
              <Card className="p-5">
                <h2 className="font-semibold mb-4 text-sm">التقييمات ({reviews.length})</h2>
                {reviews.length === 0 ? (
                  <div className="border-2 border-dashed border-[var(--color-border)] rounded-3xl p-10 text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="font-semibold mb-2">ما فيش تقييمات بعد</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                      كن أول من يقيّم هذا المبنى
                    </p>
                    <button
                      onClick={() => router.push(`/rate/${building.id}`)}
                      className="bg-[var(--color-accent)] text-[var(--color-primary)] px-6 py-3 rounded-full text-sm font-bold hover:bg-[var(--color-accent-dark)] hover:scale-105 hover:shadow-lg active:scale-95 transition-all"
                    >
                      + اكتب أول تقييم
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => {
                      const isMine = !!user && review.userId === user.uid;
                      return (
                        <div key={review.id}>
                          <ReviewCard
                            review={review}
                            buildingId={building.id}
                            userVote={userVotes[review.id] ?? null}
                            onVote={async (reviewId, type) => {
                              if (needsGoogle()) {
                                setPendingVote({ reviewId, type });
                                setShowLogin(true);
                                return { ok: false };
                              }
                              return performVote(reviewId, type);
                            }}
                            onReport={() => {
                              if (needsGoogle()) {
                                setPendingReport(review);
                                setShowLogin(true);
                              } else {
                                setReportFor(review);
                              }
                            }}
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
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />

      {showLogin && (
        <LoginPromptModal onDone={handleLoginDone} onClose={() => { setShowLogin(false); setPendingVote(null); setPendingReport(null); }} />
      )}

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

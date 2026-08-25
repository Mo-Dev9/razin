'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { NumberGrid } from '@/components/ui/NumberGrid';
import { useAuth } from '@/hooks/useAuth';
import { useBuildings } from '@/hooks/useBuildings';
import { useReviews } from '@/hooks/useReviews';
import { RATING_LABELS } from '@/types';
import type { Building, ReviewRatings } from '@/types';

interface RatePageInnerProps {
  buildingId: string;
}

export default function RatePageInner({ buildingId }: RatePageInnerProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { getBuilding } = useBuildings();
  const { submitReview, hasUserReviewed, loading } = useReviews();

  const [building, setBuilding] = useState<Building | null>(null);
  const [ratings, setRatings] = useState<ReviewRatings>({
    zahma: 3,
    humidity: 3,
    landlord: 3,
    neighbors: 3,
    cleanliness: 3,
    safety: 3,
    services: 3,
    annoyance: 3,
    elevator: 3,
    maintenance: 3,
    ac: 3,
  });
  const [comment, setComment] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/building/${buildingId}`;
    const text = 'قيّم المبنى ده على RentRate — اعرف الحقيقة قبل ما تتعاقد';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'RentRate', text, url });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [buildingId]);

  useEffect(() => {
    if (buildingId) {
      getBuilding(buildingId).then(setBuilding);
    }
  }, [buildingId, getBuilding]);

  useEffect(() => {
    if (buildingId && user) {
      hasUserReviewed(buildingId, user.uid).then(setAlreadyReviewed);
    }
  }, [buildingId, user, hasUserReviewed]);

  const overall = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.keys(ratings).length;
  const filledCount = Object.values(ratings).filter((v) => v !== 0).length;

  const handleSubmit = async () => {
    if (authLoading) return;
    if (!user) return;
    setError('');
    const ok = await submitReview(buildingId, user.uid, ratings, comment || undefined, buildingNumber || undefined, floor || undefined, apartmentNumber || undefined);
    if (ok) {
      setSubmitted(true);
    } else {
      setError('فشل حفظ التقييم. حاول مرة أخرى.');
    }
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--color-success-light)] flex items-center justify-center mx-auto mb-4" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">خلصتها!</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              تقييمك بقى جزء من دليل الحي. شارك اللينك مع حد بيفتكر يسكن هنا.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => router.push(`/building/${buildingId}`)}>
                رجوع للمبنى
              </Button>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>
            )}

            <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-5 py-3 rounded-full text-sm font-semibold hover:bg-[var(--color-surface-warm)] hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    تم النسخ!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    شارك اللينك
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (alreadyReviewed) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold mb-2">لقد قيّمت هذا المبنى بالفعل</h2>
            <Button variant="ghost" onClick={() => router.back()}>رجوع</Button>
          </div>
        </main>
      </>
    );
  }

  const keys = Object.keys(RATING_LABELS) as (keyof ReviewRatings)[];

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--color-accent-dark)] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
            صوتك مهم
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
            احك لنا عن المكان كما هو.
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            تقييمك مجهول الهوية، لكن أثره يساعد شخصاً آخر ياخذ قرار أفضل. قيّم كل جانب من 1 إلى 5.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {building && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 mb-5 hover:shadow-soft">
                <label className="text-sm font-semibold text-[var(--color-text)] block mb-2">عن أي مبنى تحدث؟</label>
                <div className="rounded-2xl bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text)]">{building.address}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{building.area}، {building.city}</p>
              </div>
            )}

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 mb-5">
              <label className="text-sm font-semibold text-[var(--color-text)] block mb-3">تفاصيل الوحدة (اختياري)</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">عمارة</label>
                  <input
                    type="text"
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(e.target.value)}
                    placeholder="رقم العمارة"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">الدور</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="رقم الدور"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">الشقة</label>
                  <input
                    type="text"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                    placeholder="رقم الشقة"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs text-[var(--color-accent-dark)] font-medium mb-2">ستقيّم جوانب الحياة</p>
              <h2 className="text-lg font-bold text-[var(--color-text)]">كيف كانت تجربتك؟</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {keys.map((key) => (
                <NumberGrid
                  key={key}
                  label={RATING_LABELS[key].ar}
                  icon={RATING_LABELS[key].icon}
                  value={ratings[key]}
                  onChange={(val) => setRatings({ ...ratings, [key]: val })}
                />
              ))}
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-[var(--color-text)] block mb-2">شيء آخر تحب تقولها؟ (اختياري)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="مثلاً: الشقة هادئة بعد الساعة 10، لكن مواقف تتلعب بسرعة..."
                maxLength={500}
                rows={4}
                className="w-full rounded-[20px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] resize-none transition-all"
              />
              <div className="flex justify-between mt-1">
                <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  ملاحظة
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)]">{comment.length}/500</span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || authLoading}
              className="w-full bg-[var(--color-primary)] text-white py-[18px] rounded-full text-sm font-bold hover:bg-[var(--color-primary-dark)] hover:shadow-[0_10px_25px_-5px_rgb(15_44_44/0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading || authLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  احفظ التقييم
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              )}
            </button>
            {!authLoading && !user && (
              <p className="text-xs text-red-600 text-center mt-2">
                حدث خطأ في تحميل الحساب. حاول تحديث الصفحة.
              </p>
            )}
          </div>

          <div className="lg:w-72">
            <div className="card-gradient rounded-3xl p-6 text-white sticky top-24">
              <h3 className="text-[var(--color-accent)] font-bold text-sm mb-4">المحصلة</h3>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>                    {filledCount} من 11</span>
                  <span>{(overall).toFixed(1)} / 5</span>
                </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                      style={{ width: `${(filledCount / 11) * 100}%` }}
                    ></div>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-xl ${star <= Math.round(overall) ? 'text-[var(--color-accent)]' : 'text-white/20'}`}>★</span>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="text-xs text-white/50 leading-relaxed">
                  متوسط تقييمات المعايير الحادية عشرة يعطيك صورة حقيقية عن الحياة في المبنى.
                </p>
                <p className="text-xs text-white/50 leading-relaxed">
                  كل تقييم مجهول الهوية ويُحسب مرة واحدة فقط لكل مستخدم.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

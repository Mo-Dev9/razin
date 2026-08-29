'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';
import { useBuildings } from '@/hooks/useBuildings';
import type { Review, Building } from '@/types';

export default function ProfilePageInner() {
  const router = useRouter();
  const { profile, loading, isLinkedWithGoogle, signInWithGoogle, signOut } = useAuth();
  const { getUserReviews, deleteReview } = useReviews();
  const { getBuilding } = useBuildings();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [buildings, setBuildings] = useState<Record<string, Building | null>>({});
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!loading && profile?.uid) {
      let cancelled = false;
      setReviewsLoading(true);
      getUserReviews(profile.uid).then(async (revs) => {
        if (cancelled) return;
        setReviews(revs);
        const bMap: Record<string, Building | null> = {};
        await Promise.all(
          revs.map(async (r) => {
            const b = await getBuilding(r.buildingId).catch(() => null);
            bMap[r.buildingId] = b || null;
          })
        );
        if (!cancelled) setBuildings(bMap);
        setReviewsLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [loading, profile?.uid, getUserReviews, getBuilding]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1"><LoadingSpinner /></main>
      </>
    );
  }

  const initial = profile?.displayName?.slice(-1) || '؟';
  const memberDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const handleLinkGoogle = async () => {
    setLinking(true);
    setLinkError('');
    const result = await signInWithGoogle();
    setLinking(false);
    if (!result.success && result.error) {
      setLinkError(result.error);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--color-accent-dark)] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
            مساحتك على RentRate
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
            أثرُك في الحي.
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            هذا كل اللي تقدر تشاركه. ملفك مجهول هويتك، لكن مساهمتك واضحة.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="card-gradient rounded-3xl p-6 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium mb-4">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {isLinkedWithGoogle ? 'حساب مرتبط' : 'مساهم مجهول'}
              </span>
              <div className="flex items-center gap-4 mb-4">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-14 h-14 rounded-2xl border-2 border-[var(--color-accent)]" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-xl font-bold text-[var(--color-primary)]">
                    {initial}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-lg">{profile?.displayName || 'مستخدم مجهول'}</h2>
                  <p className="text-xs text-white/60">
                    {isLinkedWithGoogle ? (
                      <span className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        مرتبط بـ Google
                      </span>
                    ) : (
                      `مقيم منذ ${memberDate}`
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center hover:scale-110 cursor-default" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-4 text-center hover:bg-white/15 hover:scale-[1.02] transition-all">
                  <div className="text-2xl font-bold">{profile?.reviewCount || 0}</div>
                  <div className="text-xs text-white/60 mt-1">تقييم مشارك</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center hover:bg-white/15 hover:scale-[1.02] transition-all">
                  <div className="text-2xl font-bold">{isLinkedWithGoogle ? '✓' : '🔒'}</div>
                  <div className="text-xs text-white/60 mt-1">{isLinkedWithGoogle ? 'حساب مرتبط' : 'مجهول'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-72 space-y-5">
            {!isLinkedWithGoogle && (
              <div className="bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-accent)]/30 rounded-3xl p-5 hover:shadow-soft transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text)]">احفظ تقييماتك</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">من أي جهاز</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                  تقييماتك محفوظة على هذا الجهاز فقط. سجّل بـ Google عشان تحفظها وترجعها من أي مكان.
                </p>
                {linkError && (
                  <p className="text-xs text-red-600 mb-3">{linkError}</p>
                )}
                <button
                  onClick={handleLinkGoogle}
                  disabled={linking}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-2xl py-3 text-sm font-semibold text-[var(--color-text)] hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all"
                >
                  {linking ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      ربط حسابك بـ Google
                    </>
                  )}
                </button>
              </div>
            )}

            {isLinkedWithGoogle && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-green-700">حسابك مرتبط بـ Google</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  تقييماتك محفوظة ومتزامنة. تقدر تفتح حسابك من أي جهاز بـ Google.
                </p>
              </div>
            )}

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft hover:shadow-[0_10px_30px_-5px_rgb(15_44_44/0.15)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-warm)] flex items-center justify-center mb-4 hover:scale-110 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-[var(--color-text)] mb-1">شكراً على صوتك</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                كل تقييم تقدمه يساعد شخصاً آخر يختار مكانه بأفضل شكل.
              </p>
              <Link href="/search?add=true" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent-dark)] mt-3 hover:underline underline-offset-4">
                أضف تجربة جديدة
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </Link>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 hover:shadow-soft transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-[var(--color-text)]">تقييماتك</h3>
                <span className="text-xs text-[var(--color-text-muted)]">{reviews.length} تجربة</span>
              </div>
              {reviewsLoading ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="border-2 border-dashed border-[var(--color-border)] rounded-2xl p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/15 flex items-center justify-center mx-auto mb-3 hover:scale-110 transition-transform" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
                    <span className="text-2xl">😊</span>
                  </div>
                  <h4 className="font-semibold text-sm text-[var(--color-text)] mb-1">لم تقيّم بعد</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                    ابدأ من مبنى تعرفه، تجربتك اليومية هي أكثر ما يحتاجه هذا الدليل.
                  </p>
                  <Button size="sm" onClick={() => router.push('/search')}>
                    اكتب أول تقييم
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => {
                    const building = buildings[review.buildingId];
                    const avgStr = review.overall ? review.overall.toFixed(1) : '—';
                    return (
                      <div key={review.id} className="rounded-2xl border border-[var(--color-border)] p-3 hover:border-[var(--color-accent)] transition-all">
                        <Link
                          href={`/building/${review.buildingId}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[var(--color-text)] truncate">
                              {building?.address || 'مبنى'}
                            </span>
                            <span className="flex items-center gap-1 text-sm font-bold text-[var(--color-primary)]">
                              {avgStr}
                              <span className="text-[var(--color-accent)] text-xs">★</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--color-text-muted)] truncate">
                              {building ? [building.area, building.city].filter(Boolean).join('، ') : ''}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
                              {new Date(review.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-[var(--color-text-secondary)] italic mt-2 line-clamp-2">
                              «{review.comment}»
                            </p>
                          )}
                        </Link>
                        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[var(--color-border)]">
                          <button
                            onClick={() => router.push(`/rate/${review.buildingId}?edit=1`)}
                            className="text-xs font-medium text-[var(--color-primary)] hover:underline underline-offset-4"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('متأكد إنك عايز تحذف تقييمك نهائياً؟')) return;
                              const res = await deleteReview(review.buildingId);
                              if (res.ok) {
                                setReviews((prev) => prev.filter((r) => r.id !== review.id));
                                setReviewsLoading(true);
                                getUserReviews(profile!.uid).then((revs) => {
                                  setReviews(revs);
                                  setReviewsLoading(false);
                                });
                              } else {
                                window.alert(res.error || 'فشل حذف التقييم');
                              }
                            }}
                            className="text-xs font-medium text-red-600 hover:underline underline-offset-4"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={signOut}
              className="w-full text-center text-sm text-[var(--color-text-muted)] hover:text-red-600 py-3 rounded-2xl hover:bg-red-50 transition-all"
            >
              تسجيل خروج
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

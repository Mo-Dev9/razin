'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/layout/SearchBar';
import { useBuildings } from '@/hooks/useBuildings';
import type { Building } from '@/types';

export default function HomePageInner() {
  const { searchBuildings } = useBuildings();
  const [neighborhoods, setNeighborhoods] = useState<Building[]>([]);

  useEffect(() => {
    searchBuildings('').then((all) => {
      const withReviews = all.filter((b) => b.reviewCount > 0);
      setNeighborhoods(withReviews.slice(0, 3));
    });
  }, [searchBuildings]);

  const neighborhoodNames = ['مدينة نصر', 'المعادي', 'الزمالك'];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 md:pt-24 md:pb-20">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1 text-right">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-warm)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-6">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)]"></span>
                دليل جيرانك للعيش اليومي
              </span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                <span className="text-[var(--color-text)]">قبل ما تختار</span>
                <br />
                <span className="text-[var(--color-primary)]">المكان، اسأل.</span>
              </h1>
              <p className="text-[var(--color-text-secondary)] text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                RentRate بيساعدك تعرف تفاصيل الحياة في المبنى — من صوت الشارع لتعاون المالك — من ناس عايشين هناك فعلاً.
              </p>
              <div className="max-w-md">
                <SearchBar />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-4 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                التقييمات مجهولة الهوية، وأنت اللي بتتحكم فيها
              </p>
            </div>

            <div className="flex-1 w-full max-w-md">
              <div className="relative">
                <div className="absolute -inset-3 bg-[var(--color-accent)]/20 rounded-[2rem] rotate-2"></div>
                <div className="relative bg-[var(--color-primary)] rounded-[2rem] p-8 text-white overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-4 border border-white/20 rounded-xl" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  </div>
                  <div className="relative">
                    <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs mb-6">أحياء تعرفها</span>
                    <h2 className="font-display text-2xl md:text-3xl font-bold leading-relaxed mb-8">
                      المكان الصح يبدأ من التفاصيل.
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">القاهرة · مدينة نصر</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 md:-left-4 -left-2 bg-[var(--color-accent)] rounded-2xl px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold text-[var(--color-primary)]">4.4</span>
                    <span className="text-[var(--color-primary)]">★</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-primary)] font-medium">تقييم الحي</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4">
              <span className="text-xl">📊</span>
              <span className="text-sm font-medium text-[var(--color-text)]">بيانات عن الحي</span>
            </div>
            <div className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4">
              <span className="text-xl">💬</span>
              <span className="text-sm font-medium text-[var(--color-text)]">تقييمات من السكان</span>
            </div>
            <div className="flex items-center gap-3 bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 rounded-2xl px-5 py-4">
              <span className="text-xl">⚖️</span>
              <span className="text-sm font-medium text-[var(--color-primary)]">مقارنة بين مباني</span>
            </div>
          </div>
        </section>

        {neighborhoods.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6">
              مبني يفيدك تسكن هنا
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {neighborhoods.map((b, i) => (
                <Link
                  key={b.id}
                  href={`/building/${b.id}`}
                  className="group card-gradient rounded-3xl p-6 text-white hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-sm font-bold">
                      {b.averageRatings.overall.toFixed(1)} <span className="text-[var(--color-accent)]">★</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-sm text-white/80">{neighborhoodNames[i] || b.area}</span>
                  </div>
                  <p className="text-xs text-white/60 mb-4">{b.address}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{b.reviewCount} تقييم</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.round(b.averageRatings.overall) }).map((_, j) => (
                        <span key={j} className="text-[var(--color-accent)] text-xs">★</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6">
            إزاي بتقيّم؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num: '01', title: 'اختار الحي', desc: 'ابحث عن المبنى اللي عايز تعرف تفاصيله' },
              { num: '02', title: 'قيّم', desc: 'قيّم 6 جوانب من تجربتك اليومية' },
              { num: '03', title: 'قارن', desc: 'شوف التقييمات وقارن بين المباني' },
            ].map((step) => (
              <div key={step.num} className="bg-[var(--color-primary)] rounded-3xl p-6 text-white">
                <span className="text-4xl font-bold text-white/10">{step.num}</span>
                <h3 className="text-lg font-bold text-[var(--color-accent)] mt-2">{step.title}</h3>
                <p className="text-sm text-white/60 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 pb-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6">
            السكان بيقولوا إيه؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { rating: '4.3', area: 'مدينة نصر', quote: 'الحي هادئ والجيران محترمين. الشارع فيه شجر وبهدوء بالليل.' },
              { rating: '3.7', area: 'المعادي', quote: 'الموقع ممتاز بس صوت الشارع بيدخل بالليل. المالك بطيء في الإصلاحات.' },
              { rating: '4.3', area: 'الزمالك', quote: 'المنطقة ممتازة والإنارة كويسة. أنصح بالسكن فيه للعائلات.' },
            ].map((review, i) => (
              <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-xs text-[var(--color-text-muted)]">{review.area}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-[var(--color-accent)]/15 px-2.5 py-1 rounded-lg text-sm font-bold text-[var(--color-primary)]">
                    {review.rating} <span className="text-[var(--color-accent)]">★</span>
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic">
                  «{review.quote}»
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-[var(--color-text-muted)]">مساهم في الحي</span>
                  <span className="text-xs text-[var(--color-text-muted)]">·</span>
                  <span className="text-xs text-[var(--color-text-muted)]">2026</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

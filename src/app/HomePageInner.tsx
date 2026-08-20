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
              <h1 className="text-4xl sm:text-5xl md:text-[3.2rem] font-bold leading-[1.05] mb-6">
                <span className="text-[var(--color-text)]">قبل متـ</span>
                <br />
                <span className="text-[var(--color-primary)]">Rent</span>
                <br />
                <span className="text-[var(--color-primary)]">Rate</span>
                <span className="inline-flex items-center gap-0.5 mr-3 align-middle">
                  <span className="text-[var(--color-accent)] text-2xl" style={{ animation: 'star-spin 3s ease-in-out infinite' }}>★</span>
                  <span className="text-[var(--color-accent)] text-xl" style={{ animation: 'star-spin 3s ease-in-out 0.3s infinite' }}>★</span>
                  <span className="text-[var(--color-accent)] text-2xl" style={{ animation: 'star-spin 3s ease-in-out 0.6s infinite' }}>★</span>
                  <span className="text-[var(--color-accent)] text-xl" style={{ animation: 'star-spin 3s ease-in-out 0.9s infinite' }}>★</span>
                  <span className="text-[var(--color-accent)] text-2xl" style={{ animation: 'star-spin 3s ease-in-out 1.2s infinite' }}>★</span>
                </span>
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
                <div className="relative bg-[var(--color-primary)] rounded-[28px] p-8 text-white overflow-hidden border-4 border-[var(--color-primary)]">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-4 border border-white/20 rounded-xl" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  </div>
                  <div className="relative">
                    <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs mb-6">أحياء نعرفها</span>
                    <h2 className="text-2xl md:text-3xl font-bold leading-relaxed mb-8">
                      المكان الصح يبدأ من التفاصيل.
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">القاهرة · مدينة نصر</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 md:-left-4 -left-2 bg-[var(--color-accent)] rounded-2xl px-4 py-3 shadow-lg hover:scale-110 cursor-default">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold text-[var(--color-primary)]">4.4</span>
                    <span className="text-[var(--color-primary)]" style={{ animation: 'star-spin 3s ease-in-out infinite' }}>★</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-primary)] font-medium">تقييم الحي</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 hover:shadow-soft hover:-translate-y-1 hover:scale-[1.02] cursor-default">
              <span className="text-xl">📊</span>
              <span className="text-sm font-medium text-[var(--color-text)]">بيانات عن الحي</span>
            </div>
            <div className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 hover:shadow-soft hover:-translate-y-1 hover:scale-[1.02] cursor-default">
              <span className="text-xl">💬</span>
              <span className="text-sm font-medium text-[var(--color-text)]">تقييمات من السكان</span>
            </div>
            <div className="flex items-center gap-3 bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 rounded-2xl px-5 py-4 hover:shadow-soft hover:-translate-y-1 hover:scale-[1.02] cursor-default">
              <span className="text-xl">⚖️</span>
              <span className="text-sm font-medium text-[var(--color-primary)]">مقارنة بين مباني</span>
            </div>
          </div>
        </section>

        {neighborhoods.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-6">
              مبني يفيدك تسكن هنا
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {neighborhoods.map((b, i) => (
                <Link
                  key={b.id}
                  href={`/building/${b.id}`}
                  className="group card-gradient rounded-3xl p-6 text-white hover:scale-[1.03] hover:shadow-[0_10px_30px_-5px_rgb(15_44_44/0.2)] transition-all duration-200"
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
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
            كيف يعمل RentRate
          </h2>
          <p className="text-[var(--color-text-secondary)] text-base mb-8">
            قرار السكن يستحق معرفة أكثر. بنساعدك تشوف الصورة كاملة قبل ما تدفع أو تنتقل.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num: '01', title: 'ابحث عن العنوان', desc: 'اكتب اسم الحي أو المدينة وشوف المباني القريبة منك.' },
              { num: '02', title: 'اقرأ الواقع', desc: 'قارن تفاصيل الحياة اليومية والتقييمات الحقيقية.' },
              { num: '03', title: 'اتخذ قرارك', desc: 'شارك تجربتك وخلي اللي بعدك يختار بوضوح.' },
            ].map((step) => (
              <div key={step.num} className="bg-[var(--color-primary)] rounded-3xl p-6 text-white hover:scale-[1.03] hover:shadow-[0_10px_30px_-5px_rgb(15_44_44/0.2)] transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">{step.num}</span>
                  <h3 className="text-lg font-bold text-[var(--color-accent)]">{step.title}</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">آخر التجارب</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">ما يقوله السكان</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { rating: '4.3', area: 'مدينة نصر', address: 'شارع مصطفى النحاس، مدينة نصر', city: 'القاهرة', quote: 'الحي هادئ والجيران محترمين. الشارع فيه شجر وبهدوء بالليل.', date: '20 أغسطس 2026' },
              { rating: '3.7', area: 'المعادي', address: 'شارع 9، المعادي', city: 'القاهرة', quote: 'الموقع ممتاز بس صوت الشارع بيدخل بالليل. المالك بطيء في الإصلاحات.', date: '18 أغسطس 2026' },
              { rating: '4.3', area: 'الزمالك', address: 'شارع Zamzam، الزمالك', city: 'القاهرة', quote: 'المنطقة ممتازة والإنارة كويسة. أنصح بالسكن فيه للعائلات.', date: '15 أغسطس 2026' },
            ].map((review, i) => (
              <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft hover:shadow-[0_10px_30px_-5px_rgb(15_44_44/0.15)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{review.address}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{review.city} · {review.area}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-[var(--color-accent)]/15 px-2.5 py-1 rounded-lg text-sm font-bold text-[var(--color-primary)]">
                    {review.rating} <span className="text-[var(--color-accent)]">★</span>
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                  «{review.quote}»
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-[var(--color-text-muted)]">{review.date}</span>
                  <Link href="/search" className="text-xs font-medium text-[var(--color-accent-dark)] hover:underline underline-offset-4">
                    عرض المبنى ←
                  </Link>
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

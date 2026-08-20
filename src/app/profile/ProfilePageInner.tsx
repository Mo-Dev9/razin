'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePageInner() {
  const router = useRouter();
  const { profile, loading } = useAuth();

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

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-xs font-medium text-[var(--color-accent-dark)] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
            مساحتك على RentRate
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
            أثرُك في الحي.
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            هذا كل اللي تقدر تشاركه. ملفك مجهول هويتك، لكن مساهمتك واضحة.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="bg-[var(--color-primary)] rounded-3xl p-6 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium mb-4">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                مساهم مجهول
              </span>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-xl font-bold text-[var(--color-primary)]">
                  {initial}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{profile?.displayName || 'مستخدم مجهول'}</h2>
                  <p className="text-xs text-white/60">مقيم منذ {memberDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold">{profile?.reviewCount || 0}</div>
                  <div className="text-xs text-white/60 mt-1">تقييم مشارك</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold">1</div>
                  <div className="text-xs text-white/60 mt-1">مدينة</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-72 space-y-5">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-warm)] flex items-center justify-center mb-4">
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
              <Link href="/search" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent-dark)] mt-3 hover:underline">
                أضف تجربة جديدة
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </Link>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-[var(--color-text)]">تقييماتك</h3>
                <span className="text-xs text-[var(--color-text-muted)]">{profile?.reviewCount || 0} تجربة</span>
              </div>
              <div className="border-2 border-dashed border-[var(--color-border)] rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/15 flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-dark)" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-sm text-[var(--color-text)] mb-1">
                  {(profile?.reviewCount || 0) > 0 ? 'تقييماتك' : 'لم تقيّم بعد'}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  {(profile?.reviewCount || 0) > 0
                    ? 'تقييماتك تظهر هنا'
                    : 'ابدأ من مبنى تعرفه، تجربتك اليومية هي أكثر ما يحتاجه هذا الدليل.'}
                </p>
                <Button size="sm" onClick={() => router.push('/search')}>
                  اكتب أول تقييم
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

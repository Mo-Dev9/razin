'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePageInner() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 text-center py-20 text-[var(--color-text-secondary)]">جاري التحميل...</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">حسابي</h1>

        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-xl font-bold text-white">
              {profile?.displayName?.slice(-2) || '؟'}
            </div>
            <div>
              <h2 className="font-semibold">{profile?.displayName || 'مستخدم مجهول'}</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {profile?.isAnonymous ? 'حساب مجهول' : 'حساب مسجل'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl bg-[var(--color-surface-light)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-primary)]">
                {profile?.reviewCount || 0}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">تقييم</div>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-light)] p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-primary)]">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-EG') : '-'}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">تاريخ الانضمام</div>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            ربط حساب بالإيميل (قريباً)
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

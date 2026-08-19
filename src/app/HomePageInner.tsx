'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/layout/SearchBar';

export default function HomePageInner() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">
            اعرف الحقيقة <span className="text-[var(--color-primary)]">قبل ما تتعاقد</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg mb-8 max-w-xl mx-auto">
            تقييمات حقيقية من سكان حقيقيين. اكتشف الحقيقة عن أي شقة أو مبنى.
          </p>
          <div className="flex justify-center">
            <SearchBar />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold mb-2">ابحث</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                اكتب عنوان الشقة وشوف تقييمات المبنى
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 text-center">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-semibold mb-2">اطلع</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                اقرأ تقييمات المستأجرين السابقين
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 text-center">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-semibold mb-2">قيّم</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                شارك تجربتك وساعد المستأجرين الجايين
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';
import SearchPageInner from './SearchPageInner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'بحث — RentRate',
  description: 'ابحث عن شقق ومباني في مصر وشوف تقييمات المستأجرين.',
  openGraph: {
    title: 'بحث — RentRate',
    description: 'ابحث عن شقق ومباني في مصر وشوف تقييمات المستأجرين.',
    type: 'website',
  },
};

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <Suspense fallback={<div className="text-center py-20 text-[var(--color-text-secondary)]">جاري البحث...</div>}>
          <SearchPageInner />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

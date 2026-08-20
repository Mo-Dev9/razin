import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Suspense } from 'react';
import SearchPageInner from './SearchPageInner';

export const metadata: Metadata = {
  title: 'اكتشف المباني',
  description: 'ابحث بين تجارب السكان، وقارن تفاصيل المبنى كما عاشها كل يوم.',
};

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <Suspense fallback={<div className="text-center py-20"><div className="w-10 h-10 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin mx-auto mb-4"></div><p className="text-sm text-[var(--color-text-secondary)]">جاري البحث...</p></div>}>
          <SearchPageInner />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

'use client';

import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter as Footer } from '@/components/layout/SiteFooter';

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-[var(--color-text-secondary)]">جارٍ التحميل…</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

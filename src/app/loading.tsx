'use client';

import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter as Footer } from '@/components/layout/SiteFooter';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--color-primary)]/10 ${className ?? ''}`}
      aria-hidden
    />
  );
}

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1" aria-busy="true">
        <div className="mx-auto max-w-5xl px-6 pt-10 pb-20 md:pt-14">
          {/* الوردة */}
          <div className="mb-10 text-center md:mb-14">
            <SkeletonBlock className="mx-auto h-4 w-44 rounded-full" />
            <SkeletonBlock className="mx-auto mt-4 h-12 w-full max-w-xl rounded-xl md:h-14" />
            <SkeletonBlock className="mx-auto mt-3 h-4 w-64 rounded-full" />
            <div className="mx-auto mt-7 flex max-w-md flex-wrap items-center justify-center gap-3">
              <SkeletonBlock className="h-11 w-40 rounded-full" />
              <SkeletonBlock className="h-11 w-44 rounded-full" />
            </div>
          </div>

          {/* نتائج/بطاقات */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
              >
                <SkeletonBlock className="h-5 w-24" />
                <SkeletonBlock className="mt-3 h-8 w-32" />
                <SkeletonBlock className="mt-3 h-3 w-full" />
                <SkeletonBlock className="mt-2 h-3 w-4/5" />
                <SkeletonBlock className="mt-4 h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
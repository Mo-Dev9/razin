'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter as Footer } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">            حصل مشكلة غير متوقعة</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            حاول مرة أخرى أو ارجع للرئيسية
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={reset}>حاول مرة أخرى</Button>
            <Button variant="ghost" onClick={() => router.push('/')}>
              الرئيسية
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

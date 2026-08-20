'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            يبدو أن الرابط الذي أدخلته غير صحيح أو الصفحة قد تمت إزالته
          </p>
          <Link href="/">
            <Button>الرجوع للرئيسية</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

import Link from 'next/link';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-7xl font-extrabold text-[var(--color-accent)]">404</p>
        <h1 className="mt-4 text-2xl font-extrabold text-[var(--color-primary)]">هذه الصفحة غير موجودة</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
          ربما حذف الرابط أو أن الحي غير مسجل في دليلنا بعد. عد إلى الرئيسية وابحث عن
          حيّك من جديد.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-bold text-[var(--color-accent)] transition-all hover:scale-[1.03] hover:shadow-lg"
        >
          العودة للرئيسية
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
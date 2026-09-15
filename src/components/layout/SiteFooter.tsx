import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[var(--color-primary)] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xs">
            <div className="mb-3">
              <Logo size={40} variant="dark" />
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              دليل أسعار الإيجار الحقيقية في أحياء مصر
            </p>
          </div>

          <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/" className="text-sm text-white/70 transition-colors hover:text-[var(--color-accent)]">
              الرئيسية
            </Link>
            <Link href="/privacy" className="text-sm text-white/70 transition-colors hover:text-[var(--color-accent)]">
              سياسة الخصوصية
            </Link>
            <Link href="/terms" className="text-sm text-white/70 transition-colors hover:text-[var(--color-accent)]">
              شروط الاستخدام
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/60">
            الأسعار تقديرية مبنية على إعلانات السوق العامة — وليست عروضًا ملزمة.
          </p>
          <p className="text-xs text-white/60">© {new Date().getFullYear()} رزين — جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
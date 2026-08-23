import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer className="bg-[var(--color-primary)] text-white mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xs">
            <div className="mb-3">
              <Logo size={40} variant="dark" />
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              دليل جيرانك للعيش اليومي. معلومات صادقة من ناس عايشين التجربة.
            </p>
          </div>

          <nav className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Link href="/search" className="text-sm text-white/70 hover:text-[var(--color-accent)] hover:underline underline-offset-4 transition-colors">
              اكتشف المباني
            </Link>
            <Link href="/search" className="text-sm text-white/70 hover:text-[var(--color-accent)] hover:underline underline-offset-4 transition-colors">
              شارك تجربتك
            </Link>
            <Link href="/profile" className="text-sm text-white/70 hover:text-[var(--color-accent)] hover:underline underline-offset-4 transition-colors">
              ملفي
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>© {new Date().getFullYear()} RentRate</span>
            <span className="hidden sm:inline">·</span>
            <Link href="/privacy" className="hover:text-white/70 transition-colors">سياسة الخصوصية</Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">شروط الاستخدام</Link>
            <Link href="/contact" className="hover:text-white/70 transition-colors">تواصل معنا</Link>
          </div>
          <p className="text-xs text-white/40">جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}

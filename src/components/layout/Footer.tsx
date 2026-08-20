import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[var(--color-primary)] text-white mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 32 32" width="32" height="32" className="absolute inset-0">
                  <polygon
                    points="16,1 19.2,11.2 30,11.2 21.2,17.8 24.4,28.8 16,22.2 7.6,28.8 10.8,17.8 2,11.2 12.8,11.2"
                    fill="var(--color-accent)"
                  />
                </svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F2C2C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-tight">RentRate</span>
              </div>
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

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} RentRate — جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}

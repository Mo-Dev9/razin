'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/ui/Logo';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/hara', label: 'حارة' },
  { href: '/profile', label: 'ملفي' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [activePath, setActivePath] = useState('');
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      setActivePath(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => activePath === href;

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--color-primary)]/55 backdrop-blur-md'
          : 'bg-[var(--color-primary)]'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="transition-transform group-hover:scale-105">
            <Logo size={44} variant="dark" />
          </span>
          <span className="text-2xl font-extrabold leading-none tracking-tight text-[var(--color-surface)]">
            رزين
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
                    : 'text-white/70 hover:text-[var(--color-surface)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="mx-1 h-5 w-px bg-white/20" aria-hidden />
          <Link
            href="/calculator"
            className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-primary)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-accent-dark)] hover:shadow-lg"
          >
            احسب سعرك
          </Link>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-surface)] hover:bg-white/10 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="space-y-3 border-t border-white/10 bg-[var(--color-primary)] px-4 py-4 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`block rounded-lg px-2 py-1 text-sm font-medium ${
                isActive(item.href) ? 'bg-[var(--color-accent)] text-[var(--color-primary)]' : 'text-white/70 hover:text-[var(--color-surface)]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
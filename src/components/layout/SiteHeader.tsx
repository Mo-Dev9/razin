'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-[var(--color-border)] bg-[var(--color-surface-warm)]/55 backdrop-blur-md'
          : 'border-[var(--color-border)] bg-[var(--color-surface-warm)]/95 backdrop-blur'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="transition-transform group-hover:scale-105">
            <Logo size={44} />
          </span>
          <span className="text-2xl font-extrabold leading-none tracking-tight text-[var(--color-primary)]">
            رزين
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-primary)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="mx-1 h-5 w-px bg-[var(--color-border)]" aria-hidden />
          <Link
            href="/calculator"
            className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-primary)] shadow-[0_0_18px_rgba(233,185,74,0.35)] transition-all hover:bg-[var(--color-accent-dark)] hover:shadow-[0_0_24px_rgba(233,185,74,0.55)]"
          >
            احسب سعرك
          </Link>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-primary)] hover:bg-[var(--color-border)] md:hidden"
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
        <nav className="space-y-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`block rounded-lg px-2 py-1 text-sm font-medium ${
                pathname === item.href ? 'bg-[var(--color-primary)] text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
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
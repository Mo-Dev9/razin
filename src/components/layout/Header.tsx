'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#132E35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold text-[var(--color-primary)]">تقييم</span>
            <span className="text-[9px] font-medium text-[var(--color-text-muted)] tracking-widest">TAQYEEM</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/search" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
            اكتشف المباني
          </Link>
          <Link href="/profile" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
            ملفي
          </Link>
          <Link href="/search" className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] text-white px-5 py-2 text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">
            قيم مبناك
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>
        </nav>

        <button
          className="md:hidden p-2 text-[var(--color-text)]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="القائمة"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
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

      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 space-y-3">
          <Link href="/search" className="block text-sm font-medium text-[var(--color-text-secondary)]" onClick={() => setMenuOpen(false)}>
            اكتشف المباني
          </Link>
          <Link href="/profile" className="block text-sm font-medium text-[var(--color-text-secondary)]" onClick={() => setMenuOpen(false)}>
            ملفي
          </Link>
          <Link href="/search" className="block w-full text-center rounded-full bg-[var(--color-primary)] text-white px-5 py-2 text-sm font-semibold" onClick={() => setMenuOpen(false)}>
            قيم مبناك
          </Link>
        </div>
      )}
    </header>
  );
}

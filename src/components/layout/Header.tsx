'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg viewBox="0 0 48 48" width="48" height="48" className="absolute inset-0" style={{ filter: 'drop-shadow(0 2px 8px rgba(233, 185, 74, 0.4))' }}>
              <polygon
                points="24,2 29.5,16.5 46,16.5 32.5,26 37,42 24,33 11,42 15.5,26 2,16.5 18.5,16.5"
                fill="var(--color-accent)"
              />
            </svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F2C2C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight">RentRate</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/profile" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-2">
            ملفي
          </Link>
          <Link href="/search" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-2">
            أضف تقييمك
          </Link>
          <Link href="/search" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline underline-offset-4 decoration-2">
            اكتشف المباني
          </Link>
          <Link
            href="/search"
            className="bg-[var(--color-accent)] text-[var(--color-primary)] px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[var(--color-accent-dark)] hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
          >
            قيم مبانيك
          </Link>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface-warm)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 space-y-3">
          <Link href="/profile" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline underline-offset-4">
            ملفي
          </Link>
          <Link href="/search" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline underline-offset-4">
            أضف تقييمك
          </Link>
          <Link href="/search" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:underline underline-offset-4">
            اكتشف المباني
          </Link>
          <Link
            href="/search"
            onClick={() => setMenuOpen(false)}
            className="block text-center bg-[var(--color-accent)] text-[var(--color-primary)] px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[var(--color-accent-dark)]"
          >
            قيم مبانيك
          </Link>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, profile, isLinkedWithGoogle, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = profile?.displayName?.slice(-1) || '?';

  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={48} variant="light" />
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

          {isLinkedWithGoogle && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full hover:bg-[var(--color-surface-warm)] p-1.5 transition-colors"
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                    {userInitial}
                  </div>
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-soft py-2 z-50">
                  <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-warm)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    ملفي
                  </Link>
                  <button
                    onClick={() => { signOut(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    تسجيل خروج
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/search"
              className="bg-[var(--color-accent)] text-[var(--color-primary)] px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[var(--color-accent-dark)] hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
            >
              اكتب تقييمك
            </Link>
          )}
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
          {isLinkedWithGoogle && profile && (
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-border)]">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
                  {userInitial}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{profile.displayName}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Google ✓</p>
              </div>
            </div>
          )}
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
            اكتب تقييمك
          </Link>
          {isLinkedWithGoogle && (
            <button
              onClick={() => { signOut(); setMenuOpen(false); }}
              className="block w-full text-center text-sm text-red-600 font-medium py-2"
            >
              تسجيل خروج
            </button>
          )}
        </div>
      )}
    </header>
  );
}

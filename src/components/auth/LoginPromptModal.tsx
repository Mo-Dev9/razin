'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface LoginPromptModalProps {
  onDone: () => void;
  onClose: () => void;
}

export function LoginPromptModal({ onDone, onClose }: LoginPromptModalProps) {
  const { signInWithGoogle } = useAuth();
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState('');

  const handleLink = async () => {
    if (linking) return;
    setLinking(true);
    setError('');
    const result = await signInWithGoogle();
    setLinking(false);
    if (result.success) {
      onDone();
    } else {
      setError(result.error || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-[var(--color-background)] rounded-3xl p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--color-text)]">سجّل بـ Google عشان تكمّل</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
          التصويت والبلاغات بيمروا بحساب حقيقي عشان نضمن النزاهة — تقييماتك نفسها هتفضل مجهولة.
        </p>

        <button
          onClick={handleLink}
          disabled={linking}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-2xl py-3 text-sm font-semibold text-[var(--color-text)] hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all"
        >
          {linking ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              ربط حسابك بـ Google
            </>
          )}
        </button>

        {error && <p className="text-xs text-red-600 mt-3 text-center">{error}</p>}

        <button
          onClick={onClose}
          className="w-full text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] py-2 mt-3 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
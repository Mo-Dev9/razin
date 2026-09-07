'use client';

import { useState } from 'react';
import { REPORT_REASONS } from '@/types';
import type { ReportReason } from '@/types';

interface ReportModalProps {
  address: string;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => Promise<{ ok: boolean; error?: string }>;
}

export function ReportModal({ address, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError('');
    const res = await onSubmit(reason);
    if (res.ok) {
      setSent(true);
    } else {
      setError(res.error || 'فشل إرسال البلاغ');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[var(--color-background)] rounded-3xl p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-bold text-[var(--color-text)] mb-2">تم استلام بلاغك</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5 leading-relaxed">
              هيتُراجع من فريقنا، وسنأخذ الإجراء المناسب. شكرًا لمساعدتك في الحفاظ على الدليل صادقًا.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[var(--color-primary)] text-white py-3 rounded-full text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-all"
            >
              تمام
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[var(--color-text)]">إبلاغ عن تقييم</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
              التقييم على: {address}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">ليش تضمّنه جوه البلاغ؟</p>
            <div className="space-y-2 mb-5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`w-full text-right rounded-2xl border px-4 py-3 text-sm transition-all ${
                    reason === r.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-accent)]/10 text-[var(--color-primary)] font-medium'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  {r.ar}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="w-full bg-[var(--color-primary)] text-white py-3 rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary-dark)] transition-all"
            >
              {submitting ? 'جاري الإرسال...' : 'إرسال البلاغ'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
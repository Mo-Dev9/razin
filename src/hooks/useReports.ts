import { useCallback } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import type { ReportReason } from '@/types';

export function useReports() {
  const submitReport = useCallback(
    async (
      reviewId: string,
      buildingId: string,
      reason: ReportReason
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const auth = getFirebaseAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return { ok: false, error: 'غير مصرح' };

        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewId, buildingId, reason }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, error: data.error || 'فشل إرسال البلاغ' };
        }

        return { ok: true };
      } catch (err) {
        console.error('Submit report failed:', err);
        return { ok: false, error: 'حدث خطأ غير متوقع' };
      }
    },
    []
  );

  return { submitReport };
}
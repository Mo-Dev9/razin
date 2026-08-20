'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/buildings').then((res) => {
      if (res.ok) router.push('/admin');
    }).catch(() => {});
  }, [router]);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
      } else {
        setError(data.error || 'خطأ غير معروف');
      }
    } catch {
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">تقييم</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">لوحة التحكم</p>
        </div>

        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
          <div className="mb-4">
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="أدخل كلمة المرور"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-primary)]"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error)]/20 px-4 py-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          <Button className="w-full" loading={loading} onClick={handleLogin}>
            دخول
          </Button>
        </div>

        <p className="text-center text-xs text-[var(--color-text-secondary)] mt-4">
          محاولتان فقط كل 30 دقيقة
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default function AdminDashboard() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/admin/session')
      .then((res) => {
        if (res.status === 401) router.push('/admin/login');
        else setChecked(true);
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        جاري التحقق...
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">لوحة تحكم رزين</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              إدارة بيانات الأسعار والإعلانات والجمع
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/admin/listings"
            className="block rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 hover:border-[var(--color-primary)] transition-colors"
          >
            <div className="text-3xl mb-3">📊</div>
            <h2 className="font-semibold">الإعلانات</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              إدخال إعلانات الأسعار يدويًا + استعراضها + قائمة «جمع يدوي منتظر».
            </p>
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
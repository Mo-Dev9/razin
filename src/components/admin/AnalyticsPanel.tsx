'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Analytics {
  totalUsers: number;
  totalBuildings: number;
  totalReviews: number;
  reviewsLast7Days: number;
  reviewsLast30Days: number;
  newUsersLast30Days: number;
  uniqueReviewers: number;
  reviewsWithComments: number;
  engagementRate: number;
  conversionRate: number;
  reviewsByDay: Record<string, number>;
  topBuildings: {
    id: string;
    address: string;
    area: string;
    city: string;
    reviewCount: number;
    overall: number;
  }[];
}

export function AnalyticsPanel() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        if (!res.ok) throw new Error('فشل تحميل الإحصائيات');
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطأ غير معروف');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-[var(--color-text-secondary)]">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 text-[var(--color-error)] text-sm">{error || 'لا توجد بيانات'}</div>
    );
  }

  const days = Object.keys(data.reviewsByDay);
  const values = Object.values(data.reviewsByDay);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="المستخدمين" value={data.totalUsers} sub={`+${data.newUsersLast30Days} آخر 30 يوم`} />
        <StatCard label="المباني" value={data.totalBuildings} />
        <StatCard label="التقييمات" value={data.totalReviews} sub={`${data.reviewsLast7Days} آخر أسبوع`} />
        <StatCard label="معدل التحويل" value={`${data.conversionRate}%`} sub="مستخدم → تقييم" accent />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="تقييمات هذا الأسبوع" value={data.reviewsLast7Days} />
        <StatCard label="معدل التفاعل" value={`${data.engagementRate}%`} sub="من التقييمات فيها تعليق" />
        <StatCard label="مقيّمين فريدين" value={data.uniqueReviewers} />
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-4">التقييمات — آخر 14 يوم</h3>
        <div className="flex items-end gap-1 h-32">
          {days.map((day) => {
            const val = data.reviewsByDay[day];
            const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
            const label = day.slice(5);
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t-md bg-[var(--color-primary)] transition-all group-hover:bg-[var(--color-accent)]"
                  style={{ height: `${Math.max(height, 2)}%` }}
                ></div>
                <span className="text-[9px] text-[var(--color-text-muted)] hidden sm:block">{label}</span>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {val} تقييم
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-3">أكثر المباني تقييمًا</h3>
        {data.topBuildings.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">لا توجد بيانات بعد</p>
        ) : (
          <div className="space-y-2">
            {data.topBuildings.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-surface-warm)]">
                <span className="text-xs font-bold text-[var(--color-accent)] w-5 text-center">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.address}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{b.area}، {b.city}</div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-[var(--color-primary)]">⭐ {b.overall.toFixed(1)}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{b.reviewCount} تقييم</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 text-center border ${accent ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
      <div className={`text-2xl font-bold ${accent ? 'text-[var(--color-accent-dark)]' : 'text-[var(--color-primary)]'}`}>{value}</div>
      <div className="text-xs text-[var(--color-text-secondary)]">{label}</div>
      {sub && <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sub}</div>}
    </div>
  );
}

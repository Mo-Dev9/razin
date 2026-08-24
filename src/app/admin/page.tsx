'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { AnalyticsPanel } from '@/components/admin/AnalyticsPanel';
import type { Building, Review } from '@/types';

interface Stats {
  buildings: number;
  reviews: number;
}

type Tab = 'overview' | 'analytics';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ buildings: 0, reviews: 0 });
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, rRes] = await Promise.all([
        fetch('/api/admin/buildings'),
        fetch('/api/admin/reviews'),
      ]);
      if (bRes.status === 401) {
        router.push('/admin/login');
        return;
      }
      const bData = await bRes.json();
      const rData = await rRes.json();
      setBuildings(bData.buildings || []);
      setReviews(rData.reviews || []);
      setStats({ buildings: (bData.buildings || []).length, reviews: (rData.reviews || []).length });
      setLoaded(true);
    } catch {
      setMessage({ type: 'error', text: 'فشل تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteBuilding = async (buildingId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المبنى وجميع تقييماته؟')) return;
    setActionLoading(buildingId);
    try {
      const res = await fetch('/api/admin/buildings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'تم الحذف بنجاح' });
        loadData();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'فشل الحذف' });
      }
    } catch {
      setMessage({ type: 'error', text: 'فشل الاتصال بالخادم' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (reviewId: string, buildingId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    setActionLoading(reviewId);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, buildingId }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'تم حذف التقييم' });
        loadData();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'فشل الحذف' });
      }
    } catch {
      setMessage({ type: 'error', text: 'فشل الاتصال بالخادم' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = selectedBuilding
    ? reviews.filter((r) => r.buildingId === selectedBuilding)
    : reviews;

  const getBuildingName = (id: string) => {
    const b = buildings.find((b) => b.id === id);
    return b ? b.address : id;
  };

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <div className="flex items-center gap-2">
            {tab === 'overview' && (
              <Button variant="ghost" size="sm" onClick={loadData} loading={loading}>تحديث</Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === 'overview'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-warm)]'
            }`}
          >
            المباني و التقييمات
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === 'analytics'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-warm)]'
            }`}
          >
            الإحصائيات
          </button>
        </div>

        {message && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-[var(--color-success-light)] border border-[var(--color-success)]/20 text-[var(--color-success)]' : 'bg-[var(--color-error-bg)] border border-[var(--color-error)]/20 text-[var(--color-error)]'}`}>
            {message.text}
          </div>
        )}

        {tab === 'analytics' && <AnalyticsPanel />}

        {tab === 'overview' && (
          <>
            {!loaded ? (
              <div className="text-center py-20 text-[var(--color-text-secondary)] text-sm">
                {loading ? 'جاري التحميل...' : 'اضغط على تحديث لتحميل البيانات'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
                    <div className="text-3xl font-bold text-[var(--color-primary)]">{stats.buildings}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">مبنى</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
                    <div className="text-3xl font-bold text-[var(--color-primary)]">{stats.reviews}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">تقييم</div>
                  </div>
                </div>

                <section className="mb-8">
                  <h2 className="font-semibold mb-3 text-sm">المباني ({buildings.length})</h2>
                  {buildings.length === 0 ? (
                    <div className="text-center py-10 text-[var(--color-text-secondary)] text-sm">لا توجد مباني</div>
                  ) : (
                    <div className="space-y-2">
                      {buildings.map((b) => (
                        <div key={b.id} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{b.address}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">
                              {b.area}، {b.city} · ⭐ {b.averageRatings.overall.toFixed(1)} · {b.reviewCount} تقييم
                            </div>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={actionLoading === b.id}
                            onClick={() => deleteBuilding(b.id)}
                          >
                            حذف
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-sm">التقييمات ({filteredReviews.length})</h2>
                    {selectedBuilding && (
                      <button
                        className="text-xs text-[var(--color-primary)] hover:underline"
                        onClick={() => setSelectedBuilding(null)}
                      >
                        إظهار الكل
                      </button>
                    )}
                  </div>
                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-10 text-[var(--color-text-secondary)] text-sm">لا توجد تقييمات</div>
                  ) : (
                    <div className="space-y-2">
                      {filteredReviews.map((r) => (
                        <div key={r.id} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-[var(--color-primary)] font-medium">⭐ {r.overall.toFixed(1)}</span>
                                <button
                                  className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] truncate max-w-[200px]"
                                  onClick={() => setSelectedBuilding(r.buildingId)}
                                >
                                  {getBuildingName(r.buildingId)}
                                </button>
                              </div>
                              {r.comment && (
                                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{r.comment}</p>
                              )}
                              <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                                {new Date(r.createdAt).toLocaleDateString('ar-EG')} · {r.userId.slice(0, 8)}...
                              </div>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={actionLoading === r.id}
                              onClick={() => deleteReview(r.id, r.buildingId)}
                            >
                              حذف
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { AnalyticsPanel } from '@/components/admin/AnalyticsPanel';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { ReviewDetails } from '@/components/admin/ReviewDetails';
import type { Building, Review } from '@/types';

const MapPicker = dynamic(() => import('@/components/map/MapPicker').then((m) => m.MapPicker), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-xl border border-[var(--color-border)] flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
      جاري تحميل الخريطة...
    </div>
  ),
});

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
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [form, setForm] = useState({
    address: '',
    city: '',
    area: '',
    district: '',
    buildingNumber: '',
    floor: '',
    apartmentNumber: '',
    location: null as { lat: number; lng: number } | null,
  });
  const [buildingSearch, setBuildingSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');

  const fetchData = useCallback(async () => {
    const [bRes, rRes] = await Promise.all([
      fetch('/api/admin/buildings'),
      fetch('/api/admin/reviews'),
    ]);
    if (bRes.status === 401) return null;
    const bData = await bRes.json();
    const rData = await rRes.json();
    return { buildings: bData.buildings || [], reviews: rData.reviews || [] };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchData();
        if (cancelled) return;
        if (!result) {
          router.push('/admin/login');
          return;
        }
        setBuildings(result.buildings);
        setReviews(result.reviews);
        setStats({ buildings: result.buildings.length, reviews: result.reviews.length });
        setLoaded(true);
      } catch {
        if (!cancelled) setMessage({ type: 'error', text: 'فشل تحميل البيانات' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchData, router]);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchData();
      if (!result) {
        router.push('/admin/login');
        return;
      }
      setBuildings(result.buildings);
      setReviews(result.reviews);
      setStats({ buildings: result.buildings.length, reviews: result.reviews.length });
      setLoaded(true);
    } catch {
      setMessage({ type: 'error', text: 'فشل تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  }, [fetchData, router]);

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

  const openAdd = () => {
    setEditingId(null);
    setForm({ address: '', city: '', area: '', district: '', buildingNumber: '', floor: '', apartmentNumber: '', location: null });
    setShowForm(true);
  };

  const openEdit = (b: Building) => {
    setEditingId(b.id);
    setForm({
      address: b.address || '',
      city: b.city || '',
      area: b.area || '',
      district: b.district || '',
      buildingNumber: b.buildingNumber || '',
      floor: b.floor || '',
      apartmentNumber: b.apartmentNumber || '',
      location: b.location ?? null,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSavingForm(false);
  };

  const saveBuilding = async () => {
    if (!form.address.trim() || !form.city.trim() || !form.area.trim()) {
      setMessage({ type: 'error', text: 'العنوان والمدينة والحي مطلوبين' });
      return;
    }
    if (!form.location) {
      setMessage({ type: 'error', text: 'حدد الموقع على الخريطة أولاً لضمان الدقة' });
      return;
    }

    setSavingForm(true);
    try {
      const payload = {
        address: form.address.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        district: form.district.trim(),
        buildingNumber: form.buildingNumber.trim(),
        floor: form.floor.trim(),
        apartmentNumber: form.apartmentNumber.trim(),
        location: form.location,
        ...(editingId ? { buildingId: editingId } : {}),
      };

      const res = await fetch('/api/admin/buildings', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: editingId ? 'تم تحديث المبنى' : 'تم إضافة المبنى' });
        closeForm();
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل الحفظ' });
      }
    } catch {
      setMessage({ type: 'error', text: 'فشل الاتصال بالخادم' });
    } finally {
      setSavingForm(false);
    }
  };

  const bq = buildingSearch.trim().toLowerCase();
  const filteredBuildings = bq
    ? buildings.filter((b) =>
        [b.address, b.city, b.area, b.district].filter(Boolean).some((f) => f!.toLowerCase().includes(bq))
      )
    : buildings;

  const getBuildingName = (id: string) => {
    const b = buildings.find((b) => b.id === id);
    return b ? b.address : id;
  };

  const rq = reviewSearch.trim().toLowerCase();
  const baseReviews = selectedBuilding
    ? reviews.filter((r) => r.buildingId === selectedBuilding)
    : reviews;
  const filteredReviews = rq
    ? baseReviews.filter(
        (r) =>
          (r.comment || '').toLowerCase().includes(rq) ||
          (getBuildingName(r.buildingId) || '').toLowerCase().includes(rq)
      )
    : baseReviews;

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <div className="flex items-center gap-2">
            {tab === 'overview' && (
              <>
                <Button size="sm" onClick={openAdd}>+ إضافة مبنى</Button>
                <Button variant="ghost" size="sm" onClick={() => { setLoading(true); loadData(); }} loading={loading}>تحديث</Button>
              </>
            )}
            <LogoutButton />
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
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-sm">المباني ({filteredBuildings.length})</h2>
                    {filteredBuildings.length !== buildings.length && (
                      <span className="text-xs text-[var(--color-text-muted)]">من {buildings.length}</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={buildingSearch}
                    onChange={(e) => setBuildingSearch(e.target.value)}
                    placeholder="ابحث عن مبنى بالاسم أو المدينة أو الحي..."
                    className="w-full mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                  {filteredBuildings.length === 0 ? (
                    <div className="text-center py-10 text-[var(--color-text-secondary)] text-sm">
                      {bq ? 'لا توجد نتائج مطابقة' : 'لا توجد مباني'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredBuildings.map((b) => (
                        <div key={b.id} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{b.address}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">
                              {b.area}، {b.city} · ⭐ {b.averageRatings?.overall?.toFixed(1) ?? '—'} · {b.reviewCount} تقييم
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(b)}
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={actionLoading === b.id}
                              onClick={() => deleteBuilding(b.id)}
                            >
                              حذف
                            </Button>
                          </div>
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
                  <input
                    type="text"
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    placeholder="ابحث في التعليقات أو اسم المبنى..."
                    className="w-full mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
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
                              <div className="mt-2">
                                {r.ratings ? <ReviewDetails ratings={r.ratings} /> : null}
                              </div>
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

      {showForm && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeForm}>
          <div
            className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--color-background)] sm:rounded-3xl rounded-t-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  {editingId ? 'تعديل المبنى' : 'إضافة مبنى جديد'}
                </h2>
                <button onClick={closeForm} className="w-8 h-8 rounded-full bg-[var(--color-surface-warm)] flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="عنوان المبنى"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="المدينة"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder="الحي"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="المنطقة (اختياري)"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={form.buildingNumber}
                    onChange={(e) => setForm({ ...form, buildingNumber: e.target.value })}
                    placeholder="عمارة"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-2 sm:px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                  <input
                    type="text"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="الدور"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-2 sm:px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                  <input
                    type="text"
                    value={form.apartmentNumber}
                    onChange={(e) => setForm({ ...form, apartmentNumber: e.target.value })}
                    placeholder="شقة"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-2 sm:px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>

                <div className="pt-1">
                  <label className="text-sm font-semibold text-[var(--color-text)] block mb-2">حدد موقع المبنى على الخريطة</label>
                  <MapPicker value={form.location ?? undefined} onChange={(loc) => setForm({ ...form, location: loc })} />
                  {!form.location && (
                    <p className="text-xs text-[var(--color-accent-dark)] mt-2">
                      حط علامة على مكان المبنى — مطلوب لضمان الدقة
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={saveBuilding} loading={savingForm} className="flex-1">
                    {editingId ? 'حفظ التعديلات' : 'إضافة المبنى'}
                  </Button>
                  <Button variant="ghost" onClick={closeForm}>إلغاء</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

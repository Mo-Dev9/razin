'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { EGYPT_GOVERNORATES, placesOf } from '@/lib/egypt-cities';
import { PROPERTY_TYPES, FINISHING_LEVELS } from '@/types';
import type { PropertyType, FinishingLevel, VerificationStatus } from '@/types';

interface ListingRow {
  id: string;
  governorate: string;
  city: string;
  propertyType: string;
  rooms: number;
  bathrooms: number;
  finishing: string;
  price: number;
  sourceName: string;
  sourceUrl?: string;
  verif: string;
  listedAt?: number;
  recordedAt: number;
  note?: string;
}

interface QueueRow {
  id: string;
  url: string;
  sourceName: string;
  reason: string;
  status: string;
  addedAt: number;
  collectedAt?: number;
  note?: string;
}

const PROPERTY_TYPE_AR: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map((p): [string, string] => [p.id, p.ar])
);
const FINISHING_AR: Record<string, string> = Object.fromEntries(
  FINISHING_LEVELS.map((f): [string, string] => [f.id, f.ar])
);
const QUEUE_REASON_AR: Record<string, string> = {
  login: 'يتطلب تسجيل دخول',
  captcha: 'يتطلب كابتشا',
  protected: 'محمي',
  'robots-disallow': 'ممنوع بواسطة robots.txt',
};
const QUEUE_STATUS_AR: Record<string, string> = {
  pending: 'منتظر',
  collected: 'تم جمعه يدويًا',
  skipped: 'مُتجاهل',
};
const QUEUE_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-[var(--color-accent)] text-[var(--color-primary)]',
  collected: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  skipped: 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]',
};

const inputCls =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] outline-none';
const labelCls = 'text-xs text-[var(--color-text-secondary)] mb-1 block';

function formatDate(ts?: number): string {
  return typeof ts === 'number' && Number.isFinite(ts) && ts > 0
    ? new Date(ts).toLocaleDateString('ar-EG')
    : '—';
}

function roomsLabel(rooms: number): string {
  return rooms <= 0 ? 'استوديو' : `${rooms} غرف`;
}

export default function AdminListingsPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [queueBusy, setQueueBusy] = useState<{ id: string; action: 'collected' | 'skipped' } | null>(null);

  const [formGovernorate, setFormGovernorate] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPropertyType, setFormPropertyType] = useState<PropertyType>('apartment');
  const [formRooms, setFormRooms] = useState(2);
  const [formBathrooms, setFormBathrooms] = useState(1);
  const [formFinishing, setFormFinishing] = useState<FinishingLevel>('average');
  const [formVerif, setFormVerif] = useState<VerificationStatus>('unverified');
  const [formPrice, setFormPrice] = useState('');
  const [formSourceName, setFormSourceName] = useState('');
  const [formSourceUrl, setFormSourceUrl] = useState('');
  const [formListedAt, setFormListedAt] = useState('');
  const [formNote, setFormNote] = useState('');

  const places = placesOf(formGovernorate);

  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    setPageError('');
    try {
      const res = await fetch('/api/admin/listings');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setListings((data?.listings ?? []) as ListingRow[]);
      } else {
        setPageError(data?.error || 'تعذر تحميل الإعلانات');
      }
    } catch {
      setPageError('فشل الاتصال بالخادم أثناء تحميل الإعلانات');
    } finally {
      setLoadingListings(false);
    }
  }, [router]);

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    setPageError('');
    try {
      const res = await fetch('/api/admin/listings/queue');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setQueue((data?.items ?? []) as QueueRow[]);
      } else {
        setPageError(data?.error || 'تعذر تحميل قائمة الجمع اليدوي');
      }
    } catch {
      setPageError('فشل الاتصال بالخادم أثناء تحميل قائمة الجمع اليدوي');
    } finally {
      setLoadingQueue(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/session')
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        setChecked(true);
        await Promise.all([loadListings(), loadQueue()]);
      })
      .catch(() => {
        if (!cancelled) router.push('/admin/login');
      });
    return () => {
      cancelled = true;
    };
  }, [router, loadListings, loadQueue]);

  const handleSave = async () => {
    if (!formGovernorate || !formCity) {
      setFormError('اختر المحافظة والحي/المدينة أولًا');
      return;
    }
    const price = Number(formPrice);
    if (!Number.isFinite(price) || price <= 0 || price > 5_000_000) {
      setFormError('أدخل سعرًا صحيحًا أكبر من صفر');
      return;
    }
    if (!formSourceName.trim()) {
      setFormError('اسم المصدر مطلوب');
      return;
    }

    setSaving(true);
    setFormError('');
    setFormSuccess('');

    try {
      const body: Record<string, unknown> = {
        governorate: formGovernorate,
        city: formCity,
        propertyType: formPropertyType,
        rooms: formRooms,
        bathrooms: formBathrooms,
        finishing: formFinishing,
        price,
        sourceName: formSourceName.trim(),
        verif: formVerif,
      };
      if (formSourceUrl.trim()) body.sourceUrl = formSourceUrl.trim();
      if (formListedAt) {
        const listedMs = new Date(formListedAt).getTime();
        if (Number.isFinite(listedMs) && listedMs > 0) body.listedAt = listedMs;
      }
      if (formNote.trim()) body.note = formNote.trim();

      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setFormSuccess('تم حفظ الإعلان بنجاح');
        setFormGovernorate('');
        setFormCity('');
        setFormPrice('');
        setFormSourceName('');
        setFormSourceUrl('');
        setFormListedAt('');
        setFormNote('');
        await loadListings();
      } else {
        setFormError(data?.error || 'تعذر حفظ الإعلان');
      }
    } catch {
      setFormError('فشل الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('حذف هذا الإعلان نهائيًا؟')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id }),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) await loadListings();
    } catch {
      setPageError('فشل الاتصال بالخادم أثناء حذف الإعلان');
    } finally {
      setDeletingId(null);
    }
  };

  const handleQueueAction = async (id: string, action: 'collected' | 'skipped') => {
    setQueueBusy({ id, action });
    try {
      const res = await fetch('/api/admin/listings/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action }),
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) await loadQueue();
    } catch {
      setPageError('فشل الاتصال بالخادم أثناء تحديث حالة العنصر');
    } finally {
      setQueueBusy(null);
    }
  };

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
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">إدارة الإعلانات</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              إدخال يدوي + متابعة قائمة الجمع اليدوي المنتظر
            </p>
          </div>
          <LogoutButton />
        </div>

        {pageError && (
          <div className="mb-6 rounded-xl bg-[var(--color-error-bg)] border border-[var(--color-error)]/20 px-4 py-3 text-sm text-[var(--color-error)]">
            {pageError}
          </div>
        )}

        <section className="mb-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">جمع يدوي منتظر ({queue.length})</h2>
            <Button variant="outline" size="sm" loading={loadingQueue} onClick={loadQueue}>
              تحديث
            </Button>
          </div>

          {queue.length === 0 && !loadingQueue ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              لا توجد عناصر بانتظار الجمع اليدوي.
            </p>
          ) : (
            <div className="grid gap-3">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="block text-sm font-medium text-[var(--color-primary)] hover:underline truncate"
                      >
                        {item.url}
                      </a>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--color-text-secondary)]">
                        <span>المصدر: {item.sourceName || '—'}</span>
                        <span>السبب: {QUEUE_REASON_AR[item.reason] || item.reason}</span>
                        <span>التاريخ: {formatDate(item.addedAt)}</span>
                      </div>
                      <span
                        className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${QUEUE_STATUS_STYLE[item.status] || ''}`}
                      >
                        {QUEUE_STATUS_AR[item.status] || item.status}
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={item.status !== 'pending' || !!queueBusy}
                        loading={queueBusy?.id === item.id && queueBusy.action === 'collected'}
                        onClick={() => handleQueueAction(item.id, 'collected')}
                      >
                        تم جمعه يدويًا
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={item.status !== 'pending' || !!queueBusy}
                        loading={queueBusy?.id === item.id && queueBusy.action === 'skipped'}
                        onClick={() => handleQueueAction(item.id, 'skipped')}
                      >
                        تجاهل
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
          <h2 className="text-lg font-bold mb-4">إضافة إعلان</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label className={labelCls}>المحافظة</label>
              <select
                value={formGovernorate}
                onChange={(e) => {
                  setFormGovernorate(e.target.value);
                  setFormCity('');
                }}
                className={inputCls}
              >
                <option value="">اختر المحافظة</option>
                {EGYPT_GOVERNORATES.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>الحي/المدينة</label>
              <select
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                disabled={!formGovernorate}
                className={inputCls}
              >
                <option value="">
                  {formGovernorate ? 'اختر الحي/المدينة' : 'اختر المحافظة أولًا'}
                </option>
                {places.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>نوع العقار</label>
              <select
                value={formPropertyType}
                onChange={(e) => setFormPropertyType(e.target.value as PropertyType)}
                className={inputCls}
              >
                {PROPERTY_TYPES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>عدد الحمامات</label>
              <select
                value={formBathrooms}
                onChange={(e) => setFormBathrooms(Number(e.target.value))}
                className={inputCls}
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>عدد الغرف</label>
              <select
                value={formRooms}
                onChange={(e) => setFormRooms(Number(e.target.value))}
                className={inputCls}
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? 'استوديو (0)' : i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>التشطيب</label>
              <select
                value={formFinishing}
                onChange={(e) => setFormFinishing(e.target.value as FinishingLevel)}
                className={inputCls}
              >
                {FINISHING_LEVELS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>حالة التحقق</label>
              <select
                value={formVerif}
                onChange={(e) => setFormVerif(e.target.value as VerificationStatus)}
                className={inputCls}
              >
                <option value="unverified">غير مؤكد</option>
                <option value="verified">مؤكد</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>السعر (ج.م)</label>
              <input
                type="number"
                min="0"
                step="any"
                dir="ltr"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="مثال: 1500000"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>اسم المصدر</label>
              <input
                type="text"
                value={formSourceName}
                onChange={(e) => setFormSourceName(e.target.value)}
                placeholder="مثال: عقار مصر"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>رابط الإعلان (اختياري)</label>
              <input
                type="text"
                dir="ltr"
                value={formSourceUrl}
                onChange={(e) => setFormSourceUrl(e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>تاريخ الإعلان (اختياري)</label>
              <input
                type="date"
                dir="ltr"
                value={formListedAt}
                onChange={(e) => setFormListedAt(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>ملاحظة (اختياري)</label>
              <textarea
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="مثال: سعر مفاوضة، عمارة جديدة..."
                className={`${inputCls} min-h-20 resize-y`}
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit" loading={saving}>
                حفظ الإعلان
              </Button>
              {formError && <span className="text-sm text-[var(--color-error)]">{formError}</span>}
              {formSuccess && (
                <span className="text-sm text-[var(--color-success)]">{formSuccess}</span>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">آخر الإعلانات ({listings.length})</h2>
            <Button variant="outline" size="sm" loading={loadingListings} onClick={loadListings}>
              تحديث
            </Button>
          </div>

          {listings.length === 0 && !loadingListings ? (
            <p className="text-sm text-[var(--color-text-secondary)]">لا توجد إعلانات بعد.</p>
          ) : (
            <div className="grid gap-3">
              {listings.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm">{row.city}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          - {row.governorate}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2 text-xs text-[var(--color-text-secondary)]">
                        <span>{PROPERTY_TYPE_AR[row.propertyType] || row.propertyType}</span>
                        <span>·</span>
                        <span>{roomsLabel(row.rooms)}</span>
                        <span>·</span>
                        <span>حمام {row.bathrooms}</span>
                        <span>·</span>
                        <span>تشطيب {FINISHING_AR[row.finishing] || row.finishing}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="font-bold text-[var(--color-primary)]">
                          {typeof row.price === 'number'
                            ? `${row.price.toLocaleString('en-US')} ج.م`
                            : '—'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            row.verif === 'verified'
                              ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                              : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {row.verif === 'verified' ? 'مؤكد' : 'غير مؤكد'}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-[var(--color-text-secondary)]">
                        <span>المصدر: {row.sourceName || '—'}</span>
                        {row.sourceUrl && (
                          <a
                            href={row.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            dir="ltr"
                            className="block text-[var(--color-primary)] hover:underline truncate mt-0.5"
                          >
                            {row.sourceUrl}
                          </a>
                        )}
                      </div>

                      {row.note && (
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                          ملاحظة: {row.note}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                        أُدخل: {formatDate(row.recordedAt)}
                        {row.listedAt ? ` · تاريخ الإعلان: ${formatDate(row.listedAt)}` : ''}
                      </p>
                    </div>

                    <Button
                      variant="danger"
                      size="sm"
                      loading={deletingId === row.id}
                      onClick={() => void handleDelete(row.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { EGYPT_GOVERNORATES, placesOf } from '@/lib/egypt-cities';
import { neighborhoodKey } from '@/lib/listing-utils';
import { placeByNeighborhoodId } from '@/lib/neighborhood-search';
import { MIN_DISPLAY_SOURCES } from '@/lib/price-stats';
import { estimatePriceFromListings } from '@/lib/price-estimate';
import { formatEGP } from '@/lib/format';
import { PROPERTY_TYPES } from '@/types';

interface StoredListing {
  id: string;
  city?: string;
  governorate?: string;
  propertyType?: string;
  rooms?: number | null;
  bathrooms?: number | null;
  finishing?: string | null;
  furnished?: boolean | null;
  price: number;
  recordedAt?: number;
}

interface CalculatorProps {
  initialNeighborhoodId?: string;
}

const ROOMS_OPTIONS = [
  { value: '', label: 'أي عدد غرف' },
  { value: '0', label: 'استوديو' },
  { value: '1', label: 'غرفة واحدة' },
  { value: '2', label: 'غرفتان' },
  { value: '3', label: '3 غرف' },
  { value: '4', label: '4 غرف' },
  { value: '5', label: '5 غرف' },
  { value: '6', label: '6 غرف فأكثر' },
];

const BATHROOMS_OPTIONS = [
  { value: '', label: 'أي عدد حمامات' },
  { value: '1', label: 'حمام واحد' },
  { value: '2', label: 'حمامان' },
  { value: '3', label: '3 حمامات' },
  { value: '4', label: '4 حمامات فأكثر' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'أي نوع عقار' },
  ...PROPERTY_TYPES.map((t) => ({ value: t.id, label: t.ar })),
];

const FURNISHED_OPTIONS = [
  { value: '', label: 'أي تأثيث' },
  { value: '1', label: 'مفروش' },
  { value: '0', label: 'غير مفروش' },
];

const selectCls =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-text)]';
const labelCls = 'mb-1 block text-xs font-medium text-[var(--color-text-secondary)]';

interface LoadSnapshot {
  id: string;
  error: string;
  listings: StoredListing[];
}

const EMPTY_SNAPSHOT: LoadSnapshot = { id: '', error: '', listings: [] };

export function Calculator({ initialNeighborhoodId = '' }: CalculatorProps) {
  const initialLocation = useMemo(
    () => (initialNeighborhoodId ? placeByNeighborhoodId(initialNeighborhoodId) : null),
    [initialNeighborhoodId]
  );
  const [governorate, setGovernorate] = useState(initialLocation?.governorate ?? '');
  const [place, setPlace] = useState(initialLocation?.name ?? '');
  const [neighborhoodId, setNeighborhoodIdState] = useState(
    initialLocation && initialNeighborhoodId ? initialNeighborhoodId : ''
  );
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [furnished, setFurnished] = useState('');
  const [load, setLoad] = useState<LoadSnapshot>(EMPTY_SNAPSHOT);

  const places = useMemo(() => (governorate ? placesOf(governorate) : []), [governorate]);

  useEffect(() => {
    if (!neighborhoodId) {
      return;
    }
    let cancelled = false;
    fetch(`/api/neighborhoods/listings?neighborhoodId=${encodeURIComponent(neighborhoodId)}&limit=300`)
      .then((r) => {
        if (!r.ok) throw new Error('network');
        return r.json() as Promise<{ listings: StoredListing[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setLoad({
          id: neighborhoodId,
          error: '',
          listings: (data.listings ?? []).filter((l) => typeof l.price === 'number' && l.price > 0),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoad({
          id: neighborhoodId,
          error: 'تعذر تحميل أسعار هذا الحي — حاول مرة أخرى لاحقًا.',
          listings: [],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [neighborhoodId]);

  const ready = neighborhoodId !== '' && load.id === neighborhoodId;
  const isLoading = neighborhoodId !== '' && !ready;
  const listings = useMemo(() => (ready ? load.listings : []), [ready, load.listings]);

  const { stats, basis } = useMemo(
    () =>
      estimatePriceFromListings(
        listings,
        {
          rooms: rooms === '' ? null : Number(rooms),
          bathrooms: bathrooms === '' ? null : Number(bathrooms),
          propertyType: propertyType === '' ? null : propertyType,
          furnished: furnished === '' ? null : furnished === '1',
        }
      ),
    [listings, rooms, bathrooms, propertyType, furnished]
  );

  const currentName = place || neighborhoodId;
  const limited = stats.count > 0 && stats.count < MIN_DISPLAY_SOURCES;
  const fromFallback = basis !== 'exact' && stats.count > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-[var(--color-primary)] md:text-4xl">حاسبة أسعار الإيجار</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
          اختر المحافظة والحي ثم المواصفات — نحسب لك نطاق السعر الشائع من الإعلانات
          الموثقة في السوق.
        </p>
      </div>

      <section className="mt-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-soft md:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="calc-gov" className={labelCls}>المحافظة</label>
            <select
              id="calc-gov"
              value={governorate}
              onChange={(e) => {
                setGovernorate(e.target.value);
                setPlace('');
                setNeighborhoodIdState('');
              }}
              className={selectCls}
            >
              <option value="">اختر المحافظة</option>
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="calc-place" className={labelCls}>الحي / المدينة</label>
            <select
              id="calc-place"
              value={place}
              disabled={!governorate}
              onChange={(e) => {
                const p = e.target.value;
                setPlace(p);
                if (p && governorate) {
                  setNeighborhoodIdState(neighborhoodKey(p, governorate));
                } else {
                  setNeighborhoodIdState('');
                }
              }}
              className={selectCls}
            >
              <option value="">{governorate ? 'اختر الحي' : 'اختر المحافظة أولاً'}</option>
              {places.map((pl) => (
                <option key={pl.name} value={pl.name}>{pl.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="calc-rooms" className={labelCls}>الغرف</label>
            <select id="calc-rooms" value={rooms} onChange={(e) => setRooms(e.target.value)} className={selectCls}>
              {ROOMS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="calc-baths" className={labelCls}>الحمامات</label>
            <select id="calc-baths" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className={selectCls}>
              {BATHROOMS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="calc-type" className={labelCls}>نوع العقار</label>
            <select id="calc-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={selectCls}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="calc-furnished" className={labelCls}>التأثيث</label>
            <select id="calc-furnished" value={furnished} onChange={(e) => setFurnished(e.target.value)} className={selectCls}>
              {FURNISHED_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* النتيجة */}
        <div className="mt-8">
          {!neighborhoodId ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-warm)] px-5 py-8 text-center text-sm text-[var(--color-text-secondary)]">
              اختر المحافظة ثم الحي لبدء الاحتساب.
            </div>
          ) : isLoading ? (
            <div className="rounded-2xl bg-[var(--color-surface-warm)] px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
              نحسب الأسعار...
            </div>
          ) : load.error ? (
            <div className="rounded-2xl bg-[var(--color-error-bg)] px-5 py-6 text-center text-sm text-[var(--color-error)]">{load.error}</div>
          ) : stats.count === 0 ? (
            <div className="rounded-2xl bg-[var(--color-surface-warm)] px-5 py-8 text-center text-sm leading-relaxed text-[var(--color-text-secondary)]">
              لا توجد بيانات أسعار مسجلة في {currentName || 'هذا الحي'} بعد.
              <span className="mt-2 block text-xs text-[var(--color-text-muted)]">
                ابحث عنه في{' '}
                <Link href={`/neighborhood/${encodeURIComponent(neighborhoodId)}`} className="font-semibold text-[var(--color-primary)] underline underline-offset-2">
                  صفحة الحي
                </Link>{' '}
                لترى ما تم جمعه حتى الآن.
              </span>
            </div>
          ) : (
            <div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-[var(--color-primary)] p-4 text-center">
                  <p className="text-xs text-white/50">السعر الوسطي الشهري</p>
                  <p className="mt-1 text-2xl font-extrabold text-[var(--color-accent)]" dir="ltr">{formatEGP(Math.round(stats.median ?? 0))}</p>
                </div>
                <div className="rounded-2xl bg-[var(--color-surface-warm)] p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">النطاق الشائع (25%–75%)</p>
                  <p className="mt-1 text-lg font-bold text-[var(--color-text)]" dir="ltr">
                    {stats.p25 != null && stats.p75 != null
                      ? `${formatEGP(Math.round(stats.p25))} – ${formatEGP(Math.round(stats.p75))}`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-surface-warm)] p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">أقل — أعلى</p>
                  <p className="mt-1 text-lg font-bold text-[var(--color-text)]" dir="ltr">
                    {stats.min != null && stats.max != null
                      ? `${formatEGP(Math.round(stats.min))} – ${formatEGP(Math.round(stats.max))}`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-surface-warm)] p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">عدد العينات المطابقة</p>
                  <p className="mt-1 text-2xl font-extrabold text-[var(--color-text)]" dir="ltr">{stats.count}</p>
                </div>
              </div>

              {fromFallback && (
                <p className="mt-4 rounded-2xl bg-[var(--color-accent)]/10 px-4 py-3 text-xs leading-relaxed text-[var(--color-text)]">
                  لا توجد عينات تطابق مواصفاتك (الغرف والحمّامات والنوع والتأثيث) حرفيًا —
                  الرقم أدناه مُحسب من أقرب بيانات متوفرة لديّ في {currentName} ({stats.count} إعلان)،
                  وسيتحسن مع نمو البيانات.
                </p>
              )}

              {limited && (
                <p className="mt-4 rounded-2xl bg-[var(--color-accent)]/10 px-4 py-3 text-xs leading-relaxed text-[var(--color-text)]">
                  عينات محدودة ({stats.count} من أصل {listings.length} في الحي) — النتيجة مبدئية وستتحسن مع نمو البيانات.
                </p>
              )}

              <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                يعتمد التقدير على إعلانات السوق العامة في {currentName} بمواصفاتك — وهو
                مؤشر وليس عرضًا ملزمًا.
              </p>
            </div>
          )}
        </div>
      </section>

      {neighborhoodId && (
        <div className="mt-6 text-center">
          <Link
            href={`/neighborhood/${encodeURIComponent(neighborhoodId)}`}
            className="text-sm font-semibold text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-dark)]"
          >
            عرض كل إعلانات {currentName} وأسعار الحي الكاملة
          </Link>
        </div>
      )}
    </div>
  );
}
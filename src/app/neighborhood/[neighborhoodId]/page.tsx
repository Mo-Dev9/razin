import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { placeByNeighborhoodId } from '@/lib/neighborhood-search';
import { getNeighborhoodMeta, getNeighborhoodListings } from '@/lib/neighborhood-data';
import { formatEGP } from '@/lib/format';
import { MIN_DISPLAY_SOURCES, MIN_FILTER_SOURCES, computePriceStats, type PriceStats } from '@/lib/price-stats';
import { isMonthlyListing } from '@/lib/neighborhood-writer';
import { PROPERTY_TYPES, type PropertyType } from '@/types';

export const revalidate = 60;

function safeDecode(value: string): string {
  try {
    const decoded = decodeURIComponent(value);
    return decoded === value ? value : decoded;
  } catch {
    return value;
  }
}

interface Props {
  params: Promise<{ neighborhoodId: string }>;
  searchParams: Promise<{ type?: string; furnished?: string }>;
}

/** رابط الفلتر مع الحفاظ على القيم الحالية للأبعاد الأخرى. */
function filterHref(neighborhoodId: string, type: PropertyType | null, furnished: '1' | '0' | null): string {
  const q = new URLSearchParams();
  if (type) q.set('type', type);
  if (furnished !== null) q.set('furnished', furnished);
  const s = q.toString();
  return `/neighborhood/${encodeURIComponent(neighborhoodId)}${s ? `?${s}` : ''}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { neighborhoodId: raw } = await params;
  const neighborhoodId = safeDecode(raw);
  const place = placeByNeighborhoodId(neighborhoodId);
  const meta = await getNeighborhoodMeta(neighborhoodId);
  const title = place
    ? `أسعار الإيجار في ${place.name} — ${place.governorate}`
    : 'حي غير معروف';
  const description = meta && meta.median != null
    ? `السعر الوسطي لإيجار الشقق في ${place?.name ?? neighborhoodId} هو ${formatEGP(Math.round(meta.median))} شهريًا (${meta.count} إعلان موثق).`
    : `أسعار الإيجار الحقيقية في ${place?.name ?? neighborhoodId} — تُجمع من إعلانات السوق وتُدقق يدويًا.`;
  return { title, description, openGraph: { title, description } };
}

const TYPE_AR = Object.fromEntries(PROPERTY_TYPES.map((p) => [p.id, p.ar]));

export default async function NeighborhoodPage({ params, searchParams }: Props) {
  const { neighborhoodId: raw } = await params;
  const neighborhoodId = safeDecode(raw);
  const place = placeByNeighborhoodId(neighborhoodId);
  const meta = await getNeighborhoodMeta(neighborhoodId);
  if (!place && !meta) notFound();

  const name = place?.name ?? meta?.city ?? neighborhoodId;
  const governorate = place?.governorate ?? meta?.governorate ?? null;

  // قراءة الفلتر وتطبيعه (يتجاهل القيم غير الصالحة)
  const sp = await searchParams;
  const typeParam = (PROPERTY_TYPES.some((p) => p.id === sp.type) ? sp.type : null) as PropertyType | null;
  const furnishedParam: '1' | '0' | null = sp.furnished === '1' ? '1' : sp.furnished === '0' ? '0' : null;
  const filterActive = typeParam !== null || furnishedParam !== null;

  // كل إعلانات الحي النشطة الشهرية — مصدر الفلترة وإحصاءات الفئة
  const allActive = meta ? await getNeighborhoodListings(neighborhoodId, 200) : [];
  const monthly = allActive.filter((l) => isMonthlyListing(l));
  const availableTypes = [...new Set(monthly.map((l) => l.propertyType))].filter(
    (t): t is PropertyType => PROPERTY_TYPES.some((p) => p.id === t)
  );
  const hasFurnishedData = monthly.length > 0;

  const filtered = filterActive
    ? monthly.filter(
        (l) =>
          (typeParam === null || l.propertyType === typeParam) &&
          (furnishedParam === null || (furnishedParam === '1' ? l.furnished === true : l.furnished === false))
      )
    : null;
  const filteredStats = filtered ? computePriceStats(filtered) : null;
  // لا مأزق «بيانات غير كافية»: عند غياب عينات الفئة نعرض كل الحي بوضوح،
  // وعند قلة مزروع الفئة نعرض أرقامها كتقدير مبدئي (قرار المستخدم 14/09/2026).
  const filteredFallback = filterActive && filteredStats != null && filteredStats.count === 0;
  const filteredThin = filterActive && filteredStats != null && filteredStats.count > 0 && filteredStats.count < MIN_FILTER_SOURCES;

  // أرقام العرض: من الفلتر عند تفعيله (إن وُجدت تطابقات) وإلا من خلاصة الحي المخزنة
  const shown: PriceStats = !filterActive || !filteredStats || filteredStats.count === 0
    ? ({
        count: meta?.count ?? 0,
        min: meta?.min ?? null,
        max: meta?.max ?? null,
        median: meta?.median ?? null,
        p25: meta?.p25 ?? null,
        p75: meta?.p75 ?? null,
      } satisfies PriceStats)
    : filteredStats;

  const limited = meta ? !meta.ready && meta.count > 0 : true;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* فتات التنقل */}
        <nav aria-label="مسار التنقل" className="mb-4 text-xs text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-primary)]">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span>{name}</span>
        </nav>

        {/* بطاقة الحي */}
        <section className="card-gradient relative overflow-hidden rounded-3xl px-6 py-10 md:px-10">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-[-8%] h-64 w-64 rounded-full bg-[var(--color-accent)]/10 blur-2xl" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-[var(--color-surface)] md:text-4xl">{name}</h1>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{governorate ?? '—'}</span>
                {filterActive ? (
                  <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                    عرض مفلتر
                  </span>
                ) : meta?.ready ? (
                  <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                    جاهز · عدد كافٍ من المصادر
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[var(--color-accent)]">
                    بيانات محدودة
                  </span>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-xs text-white/50">السعر الوسطي الشهري</p>
                  <p className="mt-1 text-2xl font-extrabold text-[var(--color-accent)]" dir="ltr">
                    {shown.median != null ? formatEGP(Math.round(shown.median)) : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-xs text-white/50">النطاق الأكثر شيوعًا</p>
                  <p className="mt-1 text-2xl font-extrabold text-[var(--color-surface)]" dir="ltr">
                    {shown.p25 != null && shown.p75 != null
                      ? `${formatEGP(Math.round(shown.p25))} – ${formatEGP(Math.round(shown.p75))}`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-xs text-white/50">أقل — أعلى</p>
                  <p className="mt-1 text-xl font-bold text-[var(--color-surface)]" dir="ltr">
                    {shown.min != null && shown.max != null
                      ? `${formatEGP(Math.round(shown.min))} – ${formatEGP(Math.round(shown.max))}`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-xs text-white/50">عدد المصادر</p>
                  <p className="mt-1 text-2xl font-extrabold text-[var(--color-surface)]" dir="ltr">
                    {shown.count > 0 ? `${shown.count} إعلان` : '0'}
                  </p>
                </div>
              </div>
            </div>

            <a
              href={`/calculator?neighborhoodId=${encodeURIComponent(neighborhoodId)}`}
              className="shrink-0 self-start rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-accent-dark)] hover:shadow-lg"
            >
              احسب سعر شقة هنا
            </a>
          </div>
        </section>

        {/* الفلتر — تقنيب الإحصاءات بحارس الكفاية */}
        {availableTypes.length > 0 || hasFurnishedData ? (
          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text-muted)]">نوع العقار:</span>
              <Link
                href={filterHref(neighborhoodId, null, furnishedParam)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  typeParam === null
                    ? 'bg-[var(--color-primary)] text-[var(--color-surface)]'
                    : 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                }`}
              >
                الكل
              </Link>
              {availableTypes.map((t) => (
                <Link
                  key={t}
                  href={filterHref(neighborhoodId, t, furnishedParam)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    typeParam === t
                      ? 'bg-[var(--color-primary)] text-[var(--color-surface)]'
                      : 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                  }`}
                >
                  {TYPE_AR[t]}
                </Link>
              ))}
            </div>

            {hasFurnishedData && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text-muted)]">التأثيث:</span>
                {([null, '1', '0'] as const).map((f) => {
                  const label = f === null ? 'الكل' : f === '1' ? 'مفروش' : 'غير مفروش';
                  const active = furnishedParam === f;
                  return (
                    <Link
                      key={String(f)}
                      href={filterHref(neighborhoodId, typeParam, f)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        active
                          ? 'bg-[var(--color-primary)] text-[var(--color-surface)]'
                          : 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              تُحسب أرقام كل فئة من إعلاناتها المباشرة. وعند غياب عينات كافية نعرض أقرب بيانات
              متوفرة مع تصريح بذلك — لا نخفي النتيجة عنك.
            </p>
          </div>
        ) : null}

        {/* تنبيه البيانات المحدودة */}
        {limited && !filterActive && (
          <div className="mt-6 rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-5 py-4 text-sm leading-relaxed text-[var(--color-text)]">
            {meta
              ? <>لا يزال عدد الإعلانات الموثقة ({meta.count}) أقل من {MIN_DISPLAY_SOURCES} — نكشف أسعار الحي كاملة بهذه الصفحة فور اكتمال الجمع، وكل ما يظهر الآن مبدئي. </>
              : <>لا توجد إعلانات موثقة لهذا الحي بعد. ابحث سريعًا: الموقع مسجل في دليلنا، وستظهر الأسعار فور جمع {MIN_DISPLAY_SOURCES} إعلانًا. </>
            }
            <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
              الأسعار تقديرية مبنية على إعلانات السوق العامة وليست عروضًا ملزمة.
            </span>
          </div>
        )}

        {/* حارس الكفاية */}
        {filteredFallback && (
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-accent-dark)] bg-[#FFFBF0] px-5 py-4 text-sm leading-relaxed">
            <strong className="text-[var(--color-primary)]">
              لا توجد إعلانات تطابق فئتك حاليًا.
            </strong>{' '}
            الأرقام أعلاه من كل إعلانات الحي ({meta?.count ?? 0}) — وعندما تصل عينات الفئة سنحاسب عليها وحدها.
          </div>
        )}

        {filteredThin && (
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-accent-dark)] bg-[#FFFBF0] px-5 py-4 text-sm leading-relaxed">
            <strong className="text-[var(--color-primary)]">
              فئة صغيرة العينة ({filteredStats?.count ?? 0} إعلان من أصل {meta?.count ?? 0}).
            </strong>{' '}
            نعرض أرقامها كما هي بشكل مبدئي حتى تكتمل بياناتها.
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          {/* العمود الأول: كيف تُبنى الأرقام */}
          <div className="space-y-8 lg:col-span-3">
            <a
              href={`/calculator?neighborhoodId=${encodeURIComponent(neighborhoodId)}`}
              className="block rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] p-5 text-sm transition-all hover:bg-[var(--color-border)]"
            >
              <span className="font-bold text-[var(--color-primary)]">حاسبة الأسعار</span>
              <span className="mt-1 block leading-relaxed text-[var(--color-text-secondary)]">
                قيّم سعر شقة في {name} حسب عدد الغرف والحمامات.
              </span>
            </a>
          </div>

          {/* حارة — مجتمع الحي المجهول */}
          <CommunityFeed neighborhoodId={neighborhoodId} neighborhoodName={name} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
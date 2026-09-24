import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { NeighborhoodSearch } from '@/components/home/NeighborhoodSearch';
import { getReadyNeighborhoods } from '@/lib/neighborhood-data';
import { placeByNeighborhoodId } from '@/lib/neighborhood-search';
import { arCount, formatEGP, AR_AD_FORMS } from '@/lib/format';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'رزين — دليل أسعار الإيجار الحقيقية في أحياء مصر',
  description:
    'السعر الوسطي والأقل والأعلى لإيجار الشقق في أحياء مصر — بيانات تُجمع من إعلانات السوق وتُدقق يدويًا. ابحث عن حيّك واعرف سعره الحقيقي، أو احسب سعر شقتك بنفسك.',
  openGraph: {
    title: 'رزين — دليل أسعار الإيجار الحقيقية في أحياء مصر',
    description: 'السعر الوسطي والأقل والأعلى لإيجار الشقق في حيّك.',
    url: 'https://razin-eg.vercel.app',
    siteName: 'رزين',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default async function HomePage() {
  const ready = await getReadyNeighborhoods();

  return (
    <>
      <SiteHeader />

      <main>
        {/* البطل (Hero) */}
        <section
          className="relative overflow-hidden px-6 pb-20 pt-16 text-center md:pb-28 md:pt-24"
          style={{ background: 'var(--grad-teal)' }}
        >
          <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #E9B94A 0%, transparent 70%)' }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-48 left-[-12%] h-[38rem] w-[38rem] rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #3A7D72 0%, transparent 70%)' }} />

          <div className="relative z-10 mx-auto w-full max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30"
              style={{ background: 'rgba(233, 185, 74, 0.08)' }}>
              <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
              اعرف سعر السوق قبل ما يقوله الوسيط
            </span>

            <h1 className="mt-8 text-4xl font-extrabold leading-tight text-[var(--color-surface)] sm:text-5xl md:text-6xl">
              قبل الإيداع، خذ رأي الحي — خذ رأي &quot;رزين&quot;
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
              استكشف سعر الإيجار الحقيقي في حيّك
            </p>

            <div className="mx-auto mt-10 max-w-xl">
              <NeighborhoodSearch dark autoFocus={false} placeholder="ابحث عن حي أو مدينة... مثل «المعادي» أو «6 أكتوبر»" />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#ready"
                className="rounded-full bg-[var(--color-accent)] px-7 py-3 text-sm font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-accent-dark)] hover:shadow-lg"
              >
                خذ رأي رزين!
              </a>
              <a
                href="/calculator"
                className="rounded-full px-7 py-3 text-sm font-bold text-white ring-1 ring-white/30 transition-all hover:bg-white/10"
              >
                تحقق قبل ما تدفع
              </a>
            </div>

            <p className="mt-6 text-xs text-white/60">
              27 محافظة وكل أحيائها — البحث فوري ومتاح للجميع دون تسجيل
            </p>
          </div>
        </section>

        {/* أحياء جاهزة (10+ مصدر) */}
        <section id="ready" className="mx-auto max-w-5xl px-4 py-14">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-extrabold text-[var(--color-primary)] md:text-3xl">
              الأحياء المدروسة
            </h2>
            <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-1.5 text-xs text-[var(--color-text-secondary)]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-success)]" />
              المعيار: 10 إعلانات موثوقة أو أكثر — وما دون ذلك يُعرض بحالة «بيانات محدودة»
            </div>
          </div>

          {ready.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-warm)] px-6 py-10 text-center">
              <p className="text-lg font-semibold text-[var(--color-text)]">جمع البيانات في بدايته الآن</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
                نعمل على تزويد الأحياء بالبيانات حاليًا. ابحث عن حيّك لترى ما توفر
                لدينا فورًا — وكلما نما العدد، ارتفعت دقة السعر.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ready.map((m) => {
                const place = placeByNeighborhoodId(m.neighborhoodId);
                const name = place?.name ?? m.neighborhoodId;
                const gov = place?.governorate ?? m.governorate ?? 'مصر';
                return (
                  <a
                    key={m.neighborhoodId}
                    href={`/neighborhood/${encodeURIComponent(m.neighborhoodId)}`}
                    className="group rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
                        {name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-[var(--color-success-light)] px-2.5 py-1 text-xs font-medium text-[var(--color-success)]">
                        مدروس
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{gov}</p>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">السعر الوسطي الشهري</p>
                        <p className="mt-1 text-2xl font-extrabold text-[var(--color-primary)]" dir="ltr">
                          {m.median != null ? formatEGP(Math.round(m.median)) : '—'}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">{arCount(m.count, AR_AD_FORMS)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* كيف تستخدم رزين؟ */}
        <section className="border-t border-[var(--color-border)] bg-[var(--color-success-light)] px-4 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-extrabold text-[var(--color-primary)] md:text-3xl">
              كيف تستخدم رزين؟
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-[var(--color-text-secondary)]">
              ثلاث خطوات تفصلك عن قرار سعر مدروس
            </p>
            <div className="relative mt-12">
              {/* الخط الواصل الأفقي — أجهزة كبيرة */}
              <div aria-hidden className="absolute inset-x-2 top-5 hidden h-px border-t-2 border-dashed border-[var(--color-primary)]/25 md:block" />
              {/* الخط الواصل الرأسي — موبايل */}
              <div aria-hidden className="absolute bottom-2 right-5 top-1 w-px border-r-2 border-dashed border-[var(--color-primary)]/25 md:hidden" />

              <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
                <li className="group relative flex items-start gap-4 md:flex-col md:items-center md:gap-0 md:text-center">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-base font-extrabold text-[var(--color-primary)] shadow-[0_0_16px_rgba(233,185,74,0.5)] ring-[6px] ring-[var(--color-success-light)] transition-transform duration-300 group-hover:scale-110">١</span>
                  <div className="relative flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/60 hover:shadow-lg md:mt-5 md:w-full">
                    <span aria-hidden className="pointer-events-none absolute -left-1 -top-3 select-none text-6xl font-extrabold leading-none text-[var(--color-primary)]/[0.07]">١</span>
                    <h3 className="relative text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                      ابحث عن حيّك أو احسب سعر شقتك
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      اكتب اسم حيّك في خانة البحث بالأعلى وادخل صفحته، أو استخدم حاسبة
                      الأسعار إن كنت تعرف مواصفات شقتك (غرف/حمامات).
                    </p>
                  </div>
                </li>
                <li className="group relative flex items-start gap-4 md:flex-col md:items-center md:gap-0 md:text-center">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-base font-extrabold text-[var(--color-primary)] shadow-[0_0_16px_rgba(233,185,74,0.5)] ring-[6px] ring-[var(--color-success-light)] transition-transform duration-300 group-hover:scale-110">٢</span>
                  <div className="relative flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/60 hover:shadow-lg md:mt-5 md:w-full">
                    <span aria-hidden className="pointer-events-none absolute -left-1 -top-3 select-none text-6xl font-extrabold leading-none text-[var(--color-primary)]/[0.07]">٢</span>
                    <h3 className="relative text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                      اعرف كم يدفع الناس في الحيّ
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      الرقم الوسطي = ما يدفعه معظم المستأجرين هنا، والنطاق يمنحك
                      حدود التفاوض.
                    </p>
                  </div>
                </li>
                <li className="group relative flex items-start gap-4 md:flex-col md:items-center md:gap-0 md:text-center">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-base font-extrabold text-[var(--color-primary)] shadow-[0_0_16px_rgba(233,185,74,0.5)] ring-[6px] ring-[var(--color-success-light)] transition-transform duration-300 group-hover:scale-110">٣</span>
                  <div className="relative flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/60 hover:shadow-lg md:mt-5 md:w-full">
                    <span aria-hidden className="pointer-events-none absolute -left-1 -top-3 select-none text-6xl font-extrabold leading-none text-[var(--color-primary)]/[0.07]">٣</span>
                    <h3 className="relative text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                      اسأل أهل الحيّ قبل الإيداع
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      ادخل «حارة» واطرح سؤالًا أو اقرأ تجارب الجيران حول السعر والحياة
                      في الحي — أقرب مصدر لحقيقة الشارع.
                    </p>
                    <a href="/hara" className="relative mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-4 py-2 text-xs font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-surface)]">
                      افتح صفحة «حارة» ←
                    </a>
                  </div>
                </li>
              </ol>
            </div>
            <p className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
              وراء كل رقم: نجمّع إعلانات السوق، نتحقق يدويًا، ونُحدّث باستمرار.
            </p>
          </div>
        </section>

        {/* CTA الحاسبة */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <div className="card-gradient relative overflow-hidden rounded-3xl px-6 py-12 text-center md:px-12">
            <div aria-hidden className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[var(--color-accent)]/10 blur-2xl" />
            <h2 className="relative text-2xl font-extrabold text-[var(--color-surface)] md:text-3xl">
              اعرف نطاق السعر قبل التفاوض
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
              اختر المحافظة والحي ومواصفات الشقة (غرف، حمامات) واحصل على نطاق
              السعر الشائع فورًا.
            </p>
            <a
              href="/calculator"
              className="relative mt-8 inline-block rounded-full bg-[var(--color-accent)] px-8 py-4 text-sm font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-accent-dark)] hover:shadow-lg"
            >
              افتح حاسبة الأسعار
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
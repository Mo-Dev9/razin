import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { CommunityFeed } from '@/components/community/CommunityFeed';

export const metadata: Metadata = {
  title: 'حارة — مجتمع حيّك المجهول | رزين',
  description:
    'اسأل أهل حيّك وتجاربهم عن السعر والحياة في المكان — مشاركات نصية مجهولة من كل الأحياء، بلا أسماء حقيقية ولا مواقع دقيقة.',
  openGraph: {
    title: 'حارة — مجتمع حيّك المجهول | رزين',
    description: 'اسأل أهل حيّك وتجاربهم — بلا أسماء حقيقية ولا مواقع دقيقة.',
    url: 'https://razin-eg.vercel.app/hara',
    siteName: 'رزين',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default function HarahPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ترويسة حارة — تدفق حولك من كل الأحياء (قرار ٣: مجتمع ذرة دعم لا نواة) */}
        <section
          className="relative overflow-hidden px-6 pb-16 pt-14 text-center md:pb-20 md:pt-16"
          style={{ background: 'linear-gradient(160deg, #0F2C2C 0%, #16383C 50%, #0A1E1E 100%)' }}
        >
          <div aria-hidden className="pointer-events-none absolute -top-32 right-[-10%] h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #E9B94A 0%, transparent 70%)' }} />
          <div className="relative z-10 mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30"
              style={{ background: 'rgba(233, 185, 74, 0.08)' }}>
              <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              مجتمع حيّك المجهول — لا أسماء حقيقية ولا مواقع دقيقة
            </span>
            <h1 className="mt-6 text-3xl font-extrabold leading-tight text-[var(--color-surface)] sm:text-4xl md:text-5xl">
              اسأل أهل الحي قبل الإيداع
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/70">
              تجارب الجيران حول السعر والحياة في الحي — مشاركات نصية من كل الأحياء حولك (مدى 10 كم).
            </p>
          </div>
        </section>

        {/* التدفق */}
        <section className="bg-[var(--color-surface-warm)] px-4 py-10">
          <CommunityFeed neighborhoodId={undefined} neighborhoodName={undefined} variant="full" />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
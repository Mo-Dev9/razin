import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'رزين — قريباً',
  description: 'رزين يجهّز لك دليل أسعار الإيجار الحقيقية ومجتمع الأحياء في مصر. قريباً.',
  openGraph: {
    title: 'رزين — قريباً',
    description: 'دليل أسعار الإيجار الحقيقية ومجتمع الأحياء في مصر. قريباً.',
    url: 'https://rentrate-zeta.vercel.app',
    siteName: 'رزين',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default function ComingSoonPage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
      style={{ background: 'linear-gradient(160deg, #0F2C2C 0%, #16383C 45%, #0A1E1E 100%)' }}
    >
      {/* توهجات خلفية ناعمة */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #E9B94A 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 left-[-12%] h-[38rem] w-[38rem] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #3A7D72 0%, transparent 70%)' }}
      />

      <section className="relative z-10 mx-auto w-full max-w-2xl text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium tracking-wide text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30"
          style={{ background: 'rgba(233, 185, 74, 0.08)' }}
        >
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
          قريباً &nbsp;·&nbsp; Coming soon
        </span>

        <h1
          className="mt-10 text-6xl sm:text-7xl md:text-8xl font-extrabold leading-none tracking-tight text-[var(--color-surface)]"
          style={{ fontFamily: "'Tajawal', sans-serif" }}
        >
          رزين
        </h1>
        <p className="mt-3 text-lg font-light tracking-[0.45em] text-[var(--color-accent)] sm:text-xl">
          RAZIN
        </p>

        <div
          className="mx-auto mt-10 h-px w-24"
          style={{ background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }}
        />

        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-[var(--color-background)]/80 sm:text-lg">
          قبل ما تتعاقد على إيجارك، رزين هيكشف لك قيمة السوق الحقيقية لكل حي في مصر —
          ومجتمع من الجيران يجيب على أسئلتك. نستعد للإطلاق الآن.
        </p>

        <p className="mt-12 text-xs tracking-wide text-[var(--color-background)]/40" dir="rtl">
          © 2026 رزين — تابعونا قريبًا
        </p>
      </section>
    </main>
  );
}
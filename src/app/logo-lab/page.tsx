import type { Metadata } from 'next';
import LogoHomeData from '@/components/logo-lab/LogoHomeData';
import LogoGoldRoof from '@/components/logo-lab/LogoGoldRoof';
import LogoRoofBars from '@/components/logo-lab/LogoRoofBars';

export const metadata: Metadata = {
  title: 'معمل اللوجو — رزين',
  robots: { index: false, follow: false },
};

interface Candidate {
  key: string;
  name: string;
  camp: string;
  tag: string;
  desc: string;
  Mark: typeof LogoHomeData;
}

const candidates: Candidate[] = [
  {
    key: 'A',
    name: 'بيت + بيانات',
    camp: 'اختيار المصمم',
    tag: 'الأفضل مقاسًا',
    desc: 'منزل يحوي 3 أعمدة صاعدة — شقة + قيمة حقيقية',
    Mark: LogoHomeData,
  },
  {
    key: 'B',
    name: 'سقف ذهبي بنافذة',
    camp: 'اختيار الماركتنج',
    tag: 'الأقوى ثقة',
    desc: 'سقف يحمي + شباك معاينة — حماية قبل القرار',
    Mark: LogoGoldRoof,
  },
  {
    key: 'C',
    name: 'دمج المستشار',
    camp: 'رأيي الموصى به',
    tag: 'حماية + بيانات',
    desc: 'سقف معماري ذهبي فوق 3 أعمدة تيل — المعادلة كاملة',
    Mark: LogoRoofBars,
  },
];

const sizes: number[] = [16, 32, 44, 64, 128];

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[var(--color-surface-warm)] p-2">
      {children}
    </div>
  );
}

export default function LogoLabPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[var(--color-accent-dark)]">
            صفحة معاينة فقط — لا تظهر لزوار الموقع
          </p>
          <h1 className="text-2xl font-bold">معمل اللوجو: ثلاثة مرشحين</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            انظر الأيقونة بأحجام حقيقية (16px favicon → 44px الهيدر → 128px تايل) ثم اختر. A وB رايكما
            المتخصصان، وC هو الدمج الذي أرشّحه كمستشارك.
          </p>
        </header>

        <div className="space-y-10">
          {candidates.map(({ key, name, camp, tag, desc, Mark }) => (
            <section
              key={key}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-[var(--color-accent)]">
                  {key}
                </span>
                <h2 className="text-lg font-semibold">{name}</h2>
                <span className="rounded-full bg-[var(--color-success-light)] px-2 py-0.5 text-xs font-medium text-[#1E4C48]">
                  {camp}
                </span>
                <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-accent-dark)]">
                  {tag}
                </span>
                <p className="w-full text-sm text-[var(--color-text-secondary)] md:flex-1 md:text-right">{desc}</p>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                {sizes.map((s) => (
                  <Cell key={s}>
                    <Mark size={s} variant="light" />
                  </Cell>
                ))}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="col-span-1 flex items-center justify-center rounded-xl bg-[var(--color-primary)] p-4">
                  <Mark size={96} variant="dark" />
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-warm)] p-4">
                  <Mark size={44} variant="light" />
                  <span className="text-2xl font-bold">رزين</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[var(--color-primary)] p-4">
                  <Mark size={44} variant="dark" />
                  <span className="text-2xl font-bold text-[var(--color-accent)]">رزين</span>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="mb-1 text-xl font-bold">قصّات من لوحاتك — بلا إعادة رسم</h2>
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
            استُخرجت بالقص + إزالة الخلفية + تحجيم فقط. هذه هي المقترحات الفعلية المرشحة — اضغط أي 512 لفتحها كاملة.
            «بيت + أعمدة» هو فكرتي (C) بألوان لوحتك.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { src: '/logo-lab/house-bars-128.png', name: 'بيت + أعمدة (لوكوب)', ref: '/logo-lab/house-bars-512.png' },
              { src: '/logo-lab/roof-window-128.png', name: 'سقف + شباك', ref: '/logo-lab/roof-window-512.png' },
              { src: '/logo-lab/app-tile-128.png', name: 'تايل تطبيق داكن', ref: '/logo-lab/app-tile-512.png' },
              { src: '/logo-lab/egypt-pin-128.png', name: 'خريطة مصر + سنارة', ref: '/logo-lab/egypt-pin-512.png' },
            ].map((c) => (
              <div key={c.name} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center shadow-sm">
                <img src={c.src} alt={c.name} width={128} height={128} className="mx-auto" />
                <p className="mt-2 text-sm font-semibold">{c.name}</p>
                <a href={c.ref} target="_blank" className="text-xs text-[var(--color-accent-dark)] underline">
                  فتح 512px
                </a>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-10 text-center text-sm text-[var(--color-text-muted)]">
          بعد أن تختار، أخبرني بالحرف (A/B/C) — أستبدل logo.png القديم، وأثبّت الهيدر والتفضيلة بجودة SVG الأصلية.
        </footer>
      </div>
    </main>
  );
}
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description:
    'تواصل مع فريق RentRate لأي سؤال أو اقتراح أو بلاغ عن محتوى مخالف. نقرأ كل رسالة بأنفسنا ونسعد دائمًا بسماع رأيك في المنصة.',
};

// TODO: استبدل support@rentrate.com بالبريد الرسمي الفعلي قبل الإطلاق
const CONTACT_EMAIL = 'support@rentrate.com';

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-10">
        {/* رأس الصفحة */}
        <header className="text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-[var(--color-primary)] shadow-offset">
            <span className="text-2xl">✉️</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-primary)] mb-3">
            تواصل معنا
          </h1>
          <p className="leading-8 text-[var(--color-text-secondary)] max-w-xl mx-auto">
            سؤال عن تقييمك؟ اقتراح يخدم المستأجرين؟ لاحظت محتوى مخالفًا تريد الإبلاغ عنه؟
            رسالتك توصل لنا مباشرة، ونحن من نقرأها ونرد عليها — لا روبوتات ولا ردود جاهزة.
          </p>
        </header>

        {/* بطاقة التواصل */}
        <section className="rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 40 40" width="24" height="24">
                  <polygon
                    points="20,2 24.5,14.5 38,14.5 27,22.5 31,36 20,28 9,36 13,22.5 2,14.5 15.5,14.5"
                    fill="var(--color-accent)"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">الفريق المسؤول</p>
                <p className="font-bold text-[var(--color-primary)] text-lg">RentRate Team</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                <span className="text-xl">📮</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[var(--color-text-muted)]">البريد الإلكتروني</p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  dir="ltr"
                  className="font-bold text-[var(--color-muted)] hover:text-[var(--color-accent-dark)] underline underline-offset-4 break-all"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold rounded-full px-8 py-3 hover:bg-[var(--color-muted)]"
            >
              اكتب لنا الآن ←
            </a>
            <p className="mt-4 font-bold text-[var(--color-primary)]">احنا هنا عشان نساعدك.</p>
            <p className="mt-1 text-sm leading-7 text-[var(--color-text-muted)]">
              نقرأ كل رسالة بأنفسنا، ونسعى للرد في أقرب وقت ممكن.
            </p>
          </div>
        </section>

        {/* مواضيع شائعة */}
        <section>
          <h2 className="text-lg font-bold text-[var(--color-primary)] mb-4">متى تراسلنا؟</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '📝', title: 'تعديل أو حذف تقييمك', desc: 'ابعتلنا اسم المبنى ونص التقييم وهنتصرف.' },
              { icon: '🔓', title: 'إلغاء ربط حساب Google', desc: 'نحذف بياناتك المرتبطة وترجع مجهول تمامًا.' },
              { icon: '🚩', title: 'الإبلاغ عن محتوى مخالف', desc: 'تقييم مزيف أو مسيء؟ ابعت اللينك وهنراجعه.' },
              { icon: '💡', title: 'اقتراح تطوير', desc: 'رأيك في المنصة يهمّنا ويصنع النسخة الجاية.' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)] transition-colors"
              >
                <p className="font-bold text-[var(--color-text)] mb-1">
                  <span className="me-2">{item.icon}</span>
                  {item.title}
                </p>
                <p className="text-sm leading-7 text-[var(--color-text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}

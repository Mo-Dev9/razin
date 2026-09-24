import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية — رزين',
  description: 'كيف نعالج بياناتك في رزين: موقع مقرّب، هوية مجهولة، ولا بيع للبيانات.',
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">سياسة الخصوصية</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">آخر تحديث: سبتمبر 2026 — نسخة بيتا</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">ما هي البيانات التي نجمعها؟</h2>
            <ul className="mt-2 list-inside list-disc space-y-1.5">
              <li><span className="font-semibold text-[var(--color-text)]">إعلانات السوق العامة</span> — أرقام ننشرها عمومًا ولا تخص أي مستخدم.</li>
              <li><span className="font-semibold text-[var(--color-text)]">عند مشاركتك في «حارة»</span> — نحفظ نص مشاركتك، وهوية مجهولة، وموقعًا <span className="font-semibold">مقرّبًا لمدى ~150 مترًا</span> فقط (لا نحفظ موقعك الدقيق إطلاقًا).</li>
              <li><span className="font-semibold text-[var(--color-text)]">عنوان IP</span> — يُستخدم مؤقتًا للتحديد ضد إساءة الاستخدام (تحديد معدل الطلبات) ولا يُربط بهويتك.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">الخصوصية في «حارة»</h2>
            <p>
              «حارة» مجتمع مجهول بالتصميم: لا يظهر ولا يُخزَّن اسمك الحقيقي، ولا عنوانك، ولا موقعك الدقيق.
              الإحداثيات تُقرَّب قبل الحفظ، ولا تُسلَّم أبدًا للواجهة. الاسم المعروض اسم مستعار مولّد ثابت لجهازك فقط.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">كيف تستخدم بياناتك؟</h2>
            <p>لتشغيل الخدمة وتحسينها ومنع إساءة الاستخدام. لا نبيع بياناتك ولا نشاركها مع أطراف خارجية لأغراض تسويقية.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">الكعكات والتحليلات</h2>
            <p>
              لا نستخدم كعكات تتبع. نطبق التحليلات الأساسية (سلوك الصفحة) على نحو مجهول،
              ونستخدم أداة مراقبة أخطاء تقنية قد ترسل تقارير مجهولة عند انهيار الصفحة.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">حقوقك</h2>
            <p>يحق لك الاطلاع على بياناتك وتعديلها أو طلب حذف أي مشاركة ربطت بها — عبر وسيلة التواصل الرسمية المعلنة على الموقع.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">تغييرات السياسة</h2>
            <p>نحدّث هذه الصفحة عند أي تغيير جوهري في معالجة البيانات، مع تاريخ «آخر تحديث» أعلاه.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
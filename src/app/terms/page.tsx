import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export const metadata: Metadata = {
  title: 'شروط الاستخدام — رزين',
  description: 'شروط استخدام رزين وقواعد مجتمع «حارة».',
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-extrabold text-[var(--color-text)]">شروط الاستخدام</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">آخر تحديث: سبتمبر 2026 — نسخة بيتا</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">طبيعة الأرقام</h2>
            <p>
              أسعار الإيجار المعروضة تقديرية، مبنية على إعلانات السوق العامة الخاضعة للفحص اليدوي.
              ليست عروضًا ملزمة ولا توصية بالشراء، وقد تختلف عن السعر النهائي الذي يُتفق عليه فعليًا.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">استخدام الخدمة</h2>
            <p>
              الاستخدام للأغراض المشروعة للتعرف على مستويات أسعار الإيجار. يُمنع نسخ بيانات الأسعار
              تجاريًا أو إعادة بيعها دون إذن كتابي.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">قواعد «حارة»</h2>
            <p>«حارة» مجتمع حي مجهول. بقبولك النشر فيه تلتزم بما يلي:</p>
            <ul className="mt-2 list-inside list-disc space-y-1.5">
              <li>النص فقط وبحد أقصى 500 حرف، والموضوع متصل بحيّك أو الإيجار أو الحياة المحلية.</li>
              <li>الإعلان عن خدماتك وترويجها مرحب به — هو من أهداف «حارة»: كل ما يفيد أهل الحيّ (حرفي، سباك، كهربائي، محل الحي، مدرس خصوصي). يُسمح بذكر رقم تواصل داخل المنشور للتواصل المباشر.</li>
              <li>ممنوع نشر معلومات شخصية تعريفية عن أشخاص آخرين (اسم، عنوان، رقم تواصل) دون موافقتهم.</li>
              <li>ممنوع التشهير، وخطاب الكراهية، والتحرش، والمحتوى المسيء.</li>
              <li>بلاغان من حسابين مختلفين يُخفيان المنشور فورًا للمراجعة من الفريق الإداري؛ أما البلاغ الأول فيُحال للفريق ويبقى المنشور ظاهرًا حتى ذلك الحين.</li>
              <li>الوصول العام مجهول اختياري — ولا يمكن لأي طرف الوصول لهوية أو موقع مُرسل أي منشور.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">إخلاء مسؤولية</h2>
            <p>
              نقدم الخدمة «كما هي» في نسخة بيتا. لا نضمن اكتمال الأرقام أو استمرارية التوفر،
              ولا نتحمل مسؤولية قرارات مالية تُتخذ اعتمادًا على الأرقام وحدها — اسأل أهل الحيّ
              واجمع السعر قبل الإيداع.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--color-text)]">تغيير الشروط</h2>
            <p>قد نحدّث هذه الشروط؛ استمرارك في استخدام الموقع بعد التحديث يعني قبولك للنصوص الجديدة.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
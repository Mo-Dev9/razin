import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description:
    'سياسة خصوصية RentRate: نجمع بيانات التقييمات المجهولة فقط، ولا نبيعها ولا نشاركها مع أي طرف ثالث. اعرف بالتفصيل ماذا نخزّن وكيف تتحكم في بياناتك.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-10">
        {/* رأس الصفحة */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-primary)] mb-3">
            سياسة الخصوصية
          </h1>
          <div className="w-16 h-1 bg-[var(--color-accent)] rounded-full mb-4" />
          <p className="leading-8 text-[var(--color-text-secondary)]">
            في RentRate، نؤمن بأن التقييم الصادق لا يعني التنازل عن خصوصيتك. لهذا بنينا المنصة على أساس المجهولية افتراضيًا. هذه الصفحة تشرح لك بلغة واضحة: ماذا نجمع، لماذا نجمعه، وكيف نحميه.
          </p>
          <p className="mt-4">
            <span className="inline-flex items-center gap-1 bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] text-xs font-medium rounded-full px-3 py-1">
              آخر تحديث: ٢٣ أغسطس ٢٠٢٦
            </span>
          </p>
        </header>

        {/* ١. البيانات التي نجمعها */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">١. البيانات التي نجمعها</h2>
          <p className="leading-8 text-[var(--color-text-secondary)] mb-4">
            نجمع الحد الأدنى من البيانات اللازم لتشغيل الخدمة فقط، وهو يشمل ثلاث فئات:
          </p>

          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft p-5 mb-4">
            <h3 className="font-bold text-[var(--color-text)] mb-2">أ) بيانات التقييم</h3>
            <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)]">
              <li>درجات التقييم من ١ إلى ٥ على المعايير الستة: الطرقبة، الرطوبة، تعاون المالك، الجيران، الأمان، والإضاءة.</li>
              <li>تعليق نصي اختياري تكتبه أنت.</li>
              <li>معلومات المبنى محل التقييم: المدينة والمنطقة والحي.</li>
              <li><strong className="text-[var(--color-text)]">اسم عرض مجهول</strong> يظهر بجوار تقييمك بدلًا من هويتك الحقيقية.</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft p-5 mb-4">
            <h3 className="font-bold text-[var(--color-text)] mb-2">ب) الجلسة المجهولة</h3>
            <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)]">
              <li>عند دخولك الموقع، تُنشأ جلسة مجهولة عبر Firebase Anonymous Auth تمكّنك من التقييم دون أي تسجيل.</li>
              <li><strong className="text-[var(--color-text)]">لا نجمع بريدك الإلكتروني ولا رقم هاتفك</strong> في هذا الوضع، ولا نطلب ذلك أصلًا.</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft p-5">
            <h3 className="font-bold text-[var(--color-text)] mb-2">ج) بيانات ربط جوجل (اختياري)</h3>
            <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)]">
              <li>إذا اخترت تسجيل الدخول بحساب Google — وهو أمر اختياري تمامًا — نخزّن فقط: الاسم المعروض، ورابط صورة الحساب، ومزوّد تسجيل الدخول.</li>
              <li>لا نطلب أي أذونات إضافية على حسابك، ولا نصل إلى رسائلك أو ملفاتك أو جهات اتصالك.</li>
            </ul>
          </div>
        </section>

        {/* ٢. كيف نستخدم بياناتك */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٢. كيف نستخدم بياناتك</h2>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-4">
            <li><strong className="text-[var(--color-text)]">عرض التقييمات:</strong> بيانات التقييم تُنشر على صفحة المبنى المعني لمساعدة المستأجرين الآخرين.</li>
            <li><strong className="text-[var(--color-text)]">تشغيل الخدمة:</strong> الجلسة المجهولة تُستخدم لحفظ تقييماتك ومنع التكرار.</li>
            <li><strong className="text-[var(--color-text)]">تحسين المنصة:</strong> قد نستخدم بيانات مجمَّعة (مثل أكثر المدن نشاطًا) لتحسين التجربة.</li>
          </ul>
          <p className="rounded-2xl bg-[var(--color-success-light)] border border-[var(--color-success)]/20 p-4 leading-8 text-[var(--color-text)] font-medium">
            نحن لا نبيع بياناتك، ولا نستخدمها لأغراض إعلانية، ولا نتاجر بها بأي شكل. نقطة.
          </p>
        </section>

        {/* ٣. تخزين البيانات وأمانها */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٣. تخزين البيانات وأمانها</h2>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-4">
            <li>تُخزَّن بياناتك بشكل آمن عبر خدمات Firebase على البنية التحتية السحابية لـ Google Cloud (المشروع: rentrate-99)، ويُستضاف الموقع على Vercel.</li>
            <li>الوصول إلى قواعد البيانات محمي بقواعد أمنية صارمة، ولا يستطيع أي مستخدم الاطلاع إلا على المحتوى العام للتقييمات.</li>
            <li>قد تُخزَّن البيانات وتُعالَج على خوادم تقع خارج جمهورية مصر العربية، وهي محمية وفق سياسات الأمان الخاصة بشركة Google.</li>
          </ul>
        </section>

        {/* ٤. مشاركة البيانات */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٤. مشاركة البيانات مع الأطراف الثالثة</h2>
          <p className="leading-8 text-[var(--color-text-secondary)] mb-4">لا نبيع بياناتك ولا نشاركها تجاريًا مع أي طرف ثالث. الاستثناءات الوحيدة المحدودة هي:</p>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-4">
            <li><strong className="text-[var(--color-text)]">مزوّدو البنية التحتية:</strong> Firebase (من Google) وVercel يعملان بصفتهما معالِجَين للبيانات لتشغيل الخدمة فقط، وليس لديهما أي حق في استخدامها لأغراض خاصة بهما.</li>
            <li><strong className="text-[var(--color-text)]">الالتزامات القانونية:</strong> إذا طلبت جهة قضائية أو رقابية مصرية مختصة الحصول على بيانات وفقًا للقانون.</li>
          </ul>
        </section>

        {/* ٥. حقوقك */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٥. حقوقك وبياناتك</h2>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-4">
            <li><strong className="text-[var(--color-text)]">البقاء مجهولًا:</strong> يمكنك استخدام المنصة كاملة دون تقديم أي معلومة شخصية.</li>
            <li><strong className="text-[var(--color-text)]">إلغاء الربط:</strong> تسجيل الخروج من حساب Google يعيدك إلى وضع المجهولية الكاملة في أي وقت.</li>
            <li><strong className="text-[var(--color-text)]">تعديل أو حذف تقييمك:</strong> يمكنك طلب تعديل تقييمك أو حذفه نهائيًا عبر مراسلتنا على <a href="mailto:rentrate.eg@outlook.com" className="text-[var(--color-muted)] font-medium hover:text-[var(--color-accent-dark)] underline underline-offset-4">rentrate.eg@outlook.com</a>، مع ذكر اسم المبنى ونص التقييم لنتمكن من تحديده.</li>
            <li><strong className="text-[var(--color-text)]">حذف بيانات حسابك المرتبط:</strong> عند طلبك، نحذف الاسم وصورة الحساب المخزّنة لدينا.</li>
          </ul>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            نلتزم بالتعامل مع طلباتك بما يتوافق مع القوانين المعمول بها في مصر، ومنها قانون حماية البيانات الشخصية رقم ١٥١ لسنة ٢٠٢٠.
          </p>
        </section>

        {/* ٦. ملفات تعريف الارتباط */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٦. ملفات تعريف الارتباط (Cookies)</h2>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-4">
            <li>لا نستخدم أي ملفات تعريف ارتباط إعلانية أو تتبُّعية، ولا ندمج أدوات تحليل إعلانية مثل Google Analytics الإعلاني.</li>
            <li>قد تستخدم خدمة Firebase معرِّفات تقنية ضرورية لتشغيل الجلسة المجهولة وحماية المنصة من الاستخدام المسيء؛ هذه المعرّفات لا ترتبط بهويتك.</li>
          </ul>
        </section>

        {/* ٧. خصوصية الأطفال */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٧. خصوصية الأطفال</h2>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            خدمة RentRate موجهة للبالغين الذين لديهم تجربة سكن فعلية. لا نجمع بيانات عن الأطفال بشكل مقصود، وأي شخص دون سن ١٨ عامًا يجب أن يحصل على موافقة ولي الأمر قبل استخدام المنصة.
          </p>
        </section>

        {/* ٨. تغييرات السياسة */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٨. تغييرات هذه السياسة</h2>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            قد نحدّث هذه السياسة من وقت لآخر لمواكبة تطور المنصة أو متطلبات القانون. سيظهر تاريخ «آخر تحديث» أعلى هذه الصفحة دائمًا، واستمرارك في استخدام الموقع بعد أي تعديل يعني موافقتك على النسخة المحدَّثة.
          </p>
        </section>

        {/* ٩. التواصل */}
        <section className="mb-4">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٩. التواصل معنا</h2>
          <p className="leading-8 text-[var(--color-text-secondary)] mb-6">
            أي سؤال عن خصوصيتك أو بياناتك؟ راسلنا وسنكون سعداء بالتوضيح:
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold rounded-full px-6 py-3 hover:bg-[var(--color-muted)]"
          >
            تواصل معنا ←
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'شروط الاستخدام',
  description:
    'شروط استخدام منصة RentRate: قواعد نشر التقييمات المجهولة، حقوقك ومسؤولياتك كمستخدم، وإخلاء المسؤولية. اقرأها قبل أن تنشر تقييمك الأول.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-10">
        {/* رأس الصفحة */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-primary)] mb-3">
            شروط الاستخدام
          </h1>
          <div className="w-16 h-1 bg-[var(--color-accent)] rounded-full mb-4" />
          <p className="leading-8 text-[var(--color-text-secondary)]">
            مرحبًا بك في RentRate — المنصة التي تجعل صوت المستأجر مسموعًا قبل التعاقد. هذه الشروط تحدد الاتفاق بيننا وبينك عند استخدام الموقع، فاقرأها جيدًا.
          </p>
          <p className="mt-4">
            <span className="inline-flex items-center gap-1 bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] text-xs font-medium rounded-full px-3 py-1">
              آخر تحديث: ٢٣ أغسطس ٢٠٢٦
            </span>
          </p>
        </header>

        {/* ١. قبول الشروط */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">١. قبول الشروط</h2>
          <p className="leading-8 text-[var(--color-text-secondary)] mb-4">
            بدخولك إلى موقع RentRate أو استخدامك لأي من خدماته، فإنك تقرّ بأنك قرأت هذه الشروط وفهمتها وتوافقت عليها بالكامل. إذا كنت لا توافق على أي بند منها، فيرجى التوقف عن استخدام الموقع.
          </p>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            ترتبط هذه الشروط ارتباطًا وثيقًا بـ <a href="/privacy" className="text-[var(--color-muted)] font-medium hover:text-[var(--color-accent-dark)] underline underline-offset-4">سياسة الخصوصية</a>، ويُعد قبولك لها جزءًا من هذه الاتفاقية.
          </p>
        </section>

        {/* ٢. وصف الخدمة */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٢. وصف الخدمة</h2>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            RentRate منصة إلكترونية مصرية تتيح للمستأجرين تقييم الشقق والمباني السكنية بشكل مجهول الهوية على أحد عشر معيارًا: الزحمة، الرطوبة، تعاون المالك، الجيران، الأمان، الإضاءة، الخدمات، الإزعاج، المصعد، الصيانة والتهوية. هدفنا واحد: أن يعرف كل مستأجر الحقيقة قبل أن يوقّع العقد.
          </p>
        </section>

        {/* ٣. الاستخدام المقبول */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٣. الاستخدام المقبول للموقع</h2>

          <h3 className="font-bold text-[var(--color-text)] mb-2">المسموح:</h3>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-5">
            <li>قراءة تقييمات المباني والاستفادة منها في قرار السكن.</li>
            <li>نشر تقييم صادق لمبنى <strong className="text-[var(--color-text)]">عشت فيه فعلًا</strong>، بناءً على تجربتك الشخصية الحقيقية.</li>
            <li>مشاركة روابط صفحات المباني مع أصدقائك وعائلتك.</li>
          </ul>

          <h3 className="font-bold text-[var(--color-text)] mb-2">المحظور:</h3>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-4">
            <li>نشر تقييمات مزيفة أو مدفوعة أو مكتوبة نيابة عن طرف آخر (مالك، وسيط، أو منافس).</li>
            <li>تقييم مبانٍ لم تسكن فيها، أو انتحال تجارب الآخرين.</li>
            <li>استخدام عبارات تشهيرية أو مهاجمة شخصية موجَّهة لأفراد بالاسم أو الوصف المكشِف لهم.</li>
            <li>نشر محتوى مسيء أو تحريضي أو مخالف للقانون أو الآداب العامة.</li>
            <li>محاولة اختراق الموقع، أو كشط البيانات آليًا، أو استخدام بوتات وأدوات آلية للتفاعل مع الخدمة.</li>
            <li>استخدام المنصة لأي غرض تجاري دون تصريح مسبق منا كتابيًا.</li>
          </ul>
        </section>

        {/* ٤. المحتوى الذي تنشره */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٤. المحتوى الذي تنشره (تقييماتك)</h2>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-4">
            <li><strong className="text-[var(--color-text)]">مسؤوليتك:</strong> أنت المسؤول الوحيد عن دقة تعليقاتك ومحتواها وما قد يترتب عليه من نتائج.</li>
            <li><strong className="text-[var(--color-text)]">الترخيص:</strong> بنشرك تقييمًا، تمنحنا ترخيصًا غير حصري ودائمًا لعرضه وتخزينه ونسخه ضمن تشغيل المنصة فقط.</li>
            <li><strong className="text-[var(--color-text)]">حق الإزالة:</strong> نحتفظ بحق مراجعة أي محتوى وحذفه أو حظر المستخدم المخالف — دون إشعار مسبق — إذا خالف هذه الشروط أو القانون.</li>
            <li><strong className="text-[var(--color-text)]">لا حق في النشر:</strong> نشر التقييمات امتياز وليس حقًا مكتسبًا؛ ولا نضمن عرض أي تقييم مهما كان محتواه.</li>
          </ul>
        </section>

        {/* ٥. حساب المستخدم */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٥. حساب المستخدم</h2>
          <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)] mb-4">
            <li><strong className="text-[var(--color-text)]">الوضع الافتراضي — مجهول تمامًا:</strong> تُنشأ لك جلسة مجهولة تلقائيًا عبر Firebase Anonymous Auth دون أي بريد إلكتروني أو رقم هاتف.</li>
            <li><strong className="text-[var(--color-text)]">ربط Google (اختياري):</strong> يمكنك اختياريًا ربط حساب Google للحفاظ على هويتك المعروضة عبر الجلسات؛ نخزّن في هذه الحالة اسمك المعروض وصورتك ومزوّد الدخول فقط.</li>
            <li><strong className="text-[var(--color-text)]">الحفاظ على مجهوليتك مسؤوليتك:</strong> إذا رغبت في البقاء مجهولًا، فلا تكتب داخل تعليقاتك أي معلومة تكشف هويتك أو عنوان شقتك بدقة.</li>
            <li><strong className="text-[var(--color-text)]">تسجيل الخروج:</strong> يسجّل الخروج يعيدك إلى وضع المجهولية الكاملة في أي وقت.</li>
          </ul>
        </section>

        {/* ٦. إخلاء المسؤولية */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٦. إخلاء المسؤولية وحدود المسؤولية</h2>
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft p-5 mb-4">
            <ul className="list-disc ps-6 space-y-2 leading-8 text-[var(--color-text-secondary)]">
              <li>التقييمات المنشورة على RentRate هي <strong className="text-[var(--color-text)]">آراء شخصية</strong> عبّر عنها مستأجرون مجهولون، وهي لا تمثل بأي حال آراء RentRate أو فريقها، ولا تُعد إقرارًا منها بصحتها.</li>
              <li>لا نتحقق من صحة كل تقييم بشكل فردي، ولا نضمن دقته أو اكتماله أو حداثته.</li>
              <li>قرار الإيجار أو التعاقد قرار شخصي بالكامل؛ تقع عليك وحدك مسؤولية المعاينة والتحقق والتواصل مع المالك قبل أي خطوة.</li>
              <li>تُقدَّم الخدمة «كما هي» دون أي ضمانات صريحة أو ضمنية، ولا يتحمل RentRate أي مسؤولية عن أضرار مباشرة أو غير مباشرة تنشأ عن استخدام الموقع أو الاعتماد على محتواه.</li>
            </ul>
          </div>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            باختصار: نحن نوفر منصة للصوت المجاني للمستأجرين، لكن القرار النهائي — ومسؤوليته — تبقى لك.
          </p>
        </section>

        {/* ٧. إنهاء الاستخدام */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٧. تعليق أو إنهاء الاستخدام</h2>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            نحتفظ بالحق في تعليق أو إنهاء وصول أي مستخدم إلى المنصة، وحذف محتواه، فورًا ودون إشعار، إذا خالف هذه الشروط أو حاول الإضرار بالمنصة أو بمستخدميها.
          </p>
        </section>

        {/* ٨. تعديل الشروط */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٨. التعديل على الشروط</h2>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            قد نقوم بتعديل هذه الشروط من وقت لآخر، ونُنشر النسخة المحدَّثة على هذه الصفحة مع تحديث تاريخ «آخر تحديث» أعلاها. استمرارك في استخدام الموقع بعد نشر التعديلات يعني موافقتك عليها.
          </p>
        </section>

        {/* ٩. القانون الحاكم */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">٩. القانون الحاكم والاختصاص القضائي</h2>
          <p className="leading-8 text-[var(--color-text-secondary)]">
            تخضع هذه الشروط وتُفسَّر وفقًا لقوانين جمهورية مصر العربية، وتختص المحاكم المصرية بالنظر في أي نزاع قد ينشأ عنها.
          </p>
        </section>

        {/* ١٠. التواصل */}
        <section className="mb-4">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">١٠. التواصل معنا</h2>
          <p className="leading-8 text-[var(--color-text-secondary)] mb-6">
            لديك سؤال عن هذه الشروط، أو تريد الإبلاغ عن محتوى مخالف؟
          </p>
          <a
            href="mailto:rentrate.eg@outlook.com"
            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold rounded-full px-6 py-3 hover:bg-[var(--color-muted)]"
          >
            راسلنا على rentrate.eg@outlook.com ←
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}

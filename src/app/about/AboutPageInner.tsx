'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AboutPageInner() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="text-right mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-warm)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
              قصتنا
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text)] leading-tight mb-6">
              كل باب في القاهرة<strong className="text-[var(--color-primary)]"> قصة.</strong>
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
              إحنا مجموعة شباب مصري عايش في نفس الضغط اللي بتعيش فيه — نص ساعة في التاكسى بنبحث عن شقة، ونقعد شهرين نندم.
            </p>
          </div>

          <div className="space-y-12">
            <div className="relative">
              <div className="absolute right-0 top-0 w-1 h-full bg-[var(--color-accent)]/30 rounded-full hidden md:block"></div>
              <div className="md:pr-8">
                <span className="inline-block bg-[var(--color-accent)] text-[var(--color-primary)] text-xs font-bold px-3 py-1 rounded-full mb-3">
                  المشكلة
                </span>
                <h2 className="text-xl font-bold text-[var(--color-text)] mb-3">
                  ا个赛季 seasons نتعاقد بـ &quot;الكلام الحلو&quot;
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed mb-3">
                  صاحب العقار بيوريك الشقة نضيفة، والعميل بي Deus &quot;إن شاء الله&quot;، وبعد ما تدخل — تكتشف إن الصوت من الشارع مش نايم، والمكيف مش شغال، والجيران بيعملوا حفلة كل جمعة.
                </p>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  مفيش مكان تعرف فيه الحقيقة قبل ما تدفع. مش بنك، مش صحيفة، مش حتى جارك — لأنه جارك الحالي مبيحبش يتكلم.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute right-0 top-0 w-1 h-full bg-[var(--color-primary)]/30 rounded-full hidden md:block"></div>
              <div className="md:pr-8">
                <span className="inline-block bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                  الحل
                </span>
                <h2 className="text-xl font-bold text-[var(--color-text)] mb-3">
                  عملنا مكان واحد تسمع فيه كل حاجة
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed mb-3">
                  RentRate مش مجرد موقع تقييم — هو دليلك الصادق. هنا السكان بيتقيموا المبنى على 6 معايير حقيقية: صوت الشارع، نظافة المبنى، تعاون المالك، إنارة الشارع، أمان الحي، وحالة الشقة.
                </p>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  التقييمات مجهولة الهوية بالكامل. مفيش اسم، مفيش صورة، مفيش ردود فعل. عشان تعرف الحقيقة، لازم الناس تحس بالحرية إنها تتكلم.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute right-0 top-0 w-1 h-full bg-[var(--color-accent)]/30 rounded-full hidden md:block"></div>
              <div className="md:pr-8">
                <span className="inline-block bg-[var(--color-accent)] text-[var(--color-primary)] text-xs font-bold px-3 py-1 rounded-full mb-3">
                  البداية
                </span>
                <h2 className="text-xl font-bold text-[var(--color-text)] mb-3">
                  ابدأ من بكره — بدون ما تدفع حاجة
                </h2>
                <p className="text-[var(--color-text-secondary)] leading-relaxed mb-3">
                  الموقع مفتوح للجميع. مفيش اشتراك، مفيش حساب مطلوب. كل اللي عليك تدور على العنوان، أو تضيف مبناك لو مش موجود.
                </p>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  وابدأ تقرأ اللي الناس الحقيقية بتقوله — مش اللي صاحب العقار عايزك تسمعه.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 bg-[var(--color-primary)] rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              قبل متـ Rent... Rate
            </h2>
            <p className="text-[#94B4B0] text-sm leading-relaxed mb-8 max-w-md mx-auto">
              اعرف الحقيقة من ناس عايشين هناك. قرارك مبني على واقع مش وعود.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/search"
                className="bg-[var(--color-accent)] text-[var(--color-primary)] px-8 py-3 rounded-full text-sm font-bold hover:bg-[var(--color-accent-dark)] hover:scale-105 hover:shadow-lg active:scale-95 transition-all"
              >
                اكتشف المباني
              </Link>
              <Link
                href="/search?add=true"
                className="border border-white/30 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
              >
                أضف مبناك
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

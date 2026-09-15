import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { placeByNeighborhoodId } from '@/lib/neighborhood-search';
import { getNeighborhoodMeta } from '@/lib/neighborhood-data';
import { isValidNeighborhoodId } from '@/lib/neighborhood-ids';

/**
 * حارس الوجود لصفحات الأحياء — يمنح الحالة 404 حقيقية قبل بدء البث.
 *
 * السبب: `loading.tsx` الجذر يبثّ قشرة 200 أولًا (ترتيب "قصوى" بين القرارات)،
 * فلا يقدر `notFound()` داخل الصفحة على تغيير رمز الحالة بعد البث → soft-404
 * (200 + noindex متأخر) تلتقطها العناكب/التحليلات كصفحة سليمة. الحل:
 * تحقّق الوجود هنا قبل الوصول إلى أي route:
 *   1. كتالوج egypt-cities الثابت (فوري، بلا قاعدة بيانات) — كل الأحياء النشطة
 *      فيه أصلاً، فالمسار الأكثر شيوعًا لا يلمس Firestore.
 *   2. عند اسم غير موجود في الكتالوج فقط → استعلام Firestore واحد
 *      (getNeighborhoodMeta) للأسماء التي قد تكون مسجلة في قاعدة البيانات.
 *   3. غاب الاثنان → 404 حقيقي (رسمي، بلا فهرسة).
 *
 * خطأ الـ DB لا يسقط الموقع: نمرّر للمسار عند فشل الاستعلام فتتعامل الصفحة
 * مع نفسها كالمعتاد.
 */
export const config = {
  matcher: '/neighborhood/:path',
};

function safeDecode(value: string): string {
  try {
    const decoded = decodeURIComponent(value);
    return decoded === value ? value : decoded;
  } catch {
    return value;
  }
}

const NOT_FOUND_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>الحي غير موجود | رزين</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #F2EDE5; color: #132B29; }
      main { max-width: 64rem; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; padding: 5rem 1rem; text-align: center; }
      .code { font-size: 5rem; font-weight: 800; color: #E9B94A; margin: 0; }
      h1 { font-size: 1.5rem; font-weight: 800; color: #0F2C2C; margin: 1rem 0 0; }
      p { max-width: 28rem; font-size: 0.875rem; line-height: 1.7; color: #486565; margin: 0.75rem 0 0; }
      a { display: inline-block; margin-top: 2rem; border-radius: 9999px; background: #0F2C2C; color: #E9B94A; padding: 0.75rem 1.75rem; font-size: 0.875rem; font-weight: 700; text-decoration: none; }
      a:hover { transform: scale(1.03); box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2); }
    </style>
  </head>
  <body>
    <main>
      <p class="code">404</p>
      <h1>هذه الصفحة غير موجودة</h1>
      <p>ربما حذف الرابط أو أن هذا الحي غير مسجل في دليلنا بعد. عد إلى الرئيسية وابحث عن حيّك من جديد.</p>
      <a href="/">العودة للرئيسية</a>
    </main>
  </body>
</html>`;

function notFound(): NextResponse {
  return new NextResponse(NOT_FOUND_HTML, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawId = pathname.replace(/\/+$/, '').slice('/neighborhood/'.length);
  const neighborhoodId = safeDecode(rawId);

  if (!isValidNeighborhoodId(neighborhoodId)) {
    return notFound();
  }

  // المسار السريع (بدون قاعدة بيانات): كل الأحياء النشطة في الكتالوج الثابت
  if (placeByNeighborhoodId(neighborhoodId)) {
    return NextResponse.next();
  }

  // اسم غير موجود في الكتالوج → تحقق واحد من Firestore (مؤجل/كسول)
  return getNeighborhoodMeta(neighborhoodId)
    .then((meta) => (meta ? NextResponse.next() : notFound()))
    .catch((err: unknown) => {
      console.error('[proxy] neighborhood existence check failed:', err);
      return NextResponse.next();
    });
}
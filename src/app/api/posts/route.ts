import { NextRequest, NextResponse } from 'next/server';
import type { Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimitShared, getRequestIp } from '@/lib/rate-limit';
import { authUid } from '@/lib/api-auth';
import { generateAnonymousName } from '@/lib/utils';
import { neighborhoodKey } from '@/lib/listing-utils';
import {
  POST_RADIUS_KM,
  nearestPlace,
  roundCoordinate,
  cellKey,
  candidateCells,
  docToPostView,
  hotScore,
  inEgyptBounds,
  GUIDE_SLOT_COUNT,
} from '@/lib/community';
import type { CommunityPostDoc, PostView } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_TEXT = 500;
// نافذة جلب محدودة للمنشورات: كافية للفرز والسقف، دون تضخيم قراءات Firestore
// لكل طلب قراءة عام (تحصين M2 — لا حاجة لجلب 300+ عند صفحة محددة).
const MAX_FETCH = 200;
// إرشاديات: نجلب مضاعفًا قبل فلترة status بالذاكرة حتى لا تختفي الإرشادات كلها
// إن أُخفيت الثلاث الأحدث (L1) — نأخذ GUIDE_SLOT_COUNT بعد الفلترة.
const GUIDE_FETCH_MULTIPLIER = 4;
const DEFAULT_LIMIT = 50;
const POST_CREATE_RATE = { max: 5, windowMs: 10 * 60_000 };

function parseCoord(raw: string | null, min: number, max: number): number | null {
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

function parseLimitValue(raw: string | null, fallback: number, min: number, max: number): number {
  if (raw === null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * تحويل وثائق البذرة/الإرشادية (isGuide) إلى PostView — مستقل حتى تخدم الواجهة
 * عند غياب كامل للموقع والحي (التصفح بلا موقع يُظهر البذرة وحدها).
 */
function guideDocs2Views(
  docs: Array<Record<string, unknown> & { id: string }>,
  userLat: number | null,
  userLng: number | null
): PostView[] {
  return docs.map((d) =>
    docToPostView(d as unknown as CommunityPostDoc, { userLat, userLng })
  );
}

/**
 * تدفق «حارة» حول المستخدم: يعيد منشورات القرب (بمدى POST_RADIUS_KM عبر كل
 * الأحياء) أو منشورات حي واحد عند غياب الموقع. الواجهة تستلم فقط PostView
 * (بلا إحداثيات/هوية). - «bearer» اختياري للقراءة: يُقرأ فقط لإرفاق myVote.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = parseCoord(sp.get('lat'), -90, 90);
  const lng = parseCoord(sp.get('lng'), -180, 180);
  const hasLoc = lat !== null && lng !== null;
  const neighborhoodId = (sp.get('neighborhoodId') ?? '').trim() || null;
  const sort = sp.get('sort') === 'top' ? 'top' : 'hot';
  const limit = parseLimitValue(sp.get('limit'), DEFAULT_LIMIT, 1, 100);
  const offset = parseLimitValue(sp.get('offset'), 0, 0, 1000);
  const uid = await authUid(req.headers.get('authorization'));

  try {
    const db = getAdminDb();

    // مشاركات إرشادية (isGuide) تظهر في أول الصفحة مهما كان الموقع/الحي — بلا
    // إحداثيات ولا حيّ، فلا تدخل استعلام القرب. تُجلب للصفحة الأولى فقط، وتُخدم
    // حتى لو لم يقدم المستخدم موقعًا ولا حيًّا (تصفح بلا موقع).
    let guideDocs: Array<Record<string, unknown> & { id: string }> = [];
    if (offset === 0) {
      const guideSnap = await db
        .collection('posts')
        .where('isGuide', '==', true)
        .limit(GUIDE_SLOT_COUNT * GUIDE_FETCH_MULTIPLIER)
        .get();
      const raw: Array<Record<string, unknown> & { id: string }> = guideSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      }));
      guideDocs = raw
        .filter((d) => ((d.status as string | undefined) ?? 'open') === 'open')
        .slice(0, GUIDE_SLOT_COUNT);
    }

    let query: Query | null = null;
    if (hasLoc) {
      const cells = candidateCells(lat, lng, POST_RADIUS_KM);
      // خارج نطاق حارة مصر (أو عند القطب): لا سلوك قاتل ولا استعلام فارغ
      if (cells.length === 0) {
        return NextResponse.json({ posts: guideDocs2Views(guideDocs, hasLoc ? lat : null, hasLoc ? lng : null), count: 0, hasMore: false, nextOffset: 0 });
      }
      query = db.collection('posts').where('status', '==', 'open').where('cell', 'in', cells);
    } else if (neighborhoodId) {
      query = db.collection('posts')
        .where('neighborhoodId', '==', neighborhoodId)
        .where('status', '==', 'open');
    } else {
      // تصفح بلا موقع: البذرة/المشاركات الإرشادية وحدها — بلا منشورات حي.
      const guideViews = guideDocs2Views(guideDocs, null, null);
      return NextResponse.json({ posts: guideViews, count: guideViews.length, hasMore: false, nextOffset: guideViews.length });
    }

    const snap = await query.limit(MAX_FETCH).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // كل منشور قريبًا يُحوَّل لعرض، ولاختبار القرب عند الحاجة تُحسب المسافة
    // الدقيقة هنا (الفلتر الخلوي أولي — القرب القاطع بعدها).
    const views: PostView[] = docs.map((d) =>
      docToPostView(d as unknown as CommunityPostDoc, {
        userLat: hasLoc ? lat : null,
        userLng: hasLoc ? lng : null,
      })
    );
    const kept = views.filter((v) => v.kind !== 'far');
    const guideViews = guideDocs2Views(guideDocs, hasLoc ? lat : null, hasLoc ? lng : null);

    kept.sort((a, b) => {
      if (sort === 'top') {
        return b.netVotes - a.netVotes || b.createdAt - a.createdAt;
      }
      return hotScore(b, Date.now()) - hotScore(a, Date.now());
    });

    const page = offset === 0 ? [...guideViews, ...kept.slice(0, limit)] : kept.slice(offset, offset + limit);

    // إثراء myVote للصفحة المعروضة فقط — لا لكل النافذة المجلوبة (تحصين M2:
    // قراءة التصويتات محصورة بعدد العناصر الفعلي المعروض لا بـ MAX_FETCH).
    if (uid && page.length > 0) {
      const voteRefs = page.map((v) => db.collection('posts').doc(v.id).collection('votes').doc(uid));
      const voteSnap = await db.getAll(...voteRefs);
      voteSnap.forEach((s, i) => {
        if (s.exists) {
          const vote = s.data()?.vote as unknown;
          page[i] = { ...page[i], myVote: vote === 1 || vote === -1 ? (vote as -1 | 1) : 0 };
        }
      });
    }

    const nextOffset = offset + kept.slice(offset, offset + limit).length;
    return NextResponse.json({
      posts: page,
      count: kept.length,
      hasMore: nextOffset < kept.length,
      nextOffset,
    });
  } catch (err) {
    console.error('Posts feed failed:', err);
    return NextResponse.json({ error: 'تعذر تحميل منشورات الحارة' }, { status: 500 });
  }
}

/**
 * إنشاء منشور: يتطلب هوية مجهولة (Bearer) + rate-limit + **موقعًا إجباريًا داخل
 * مصر** (سيرفر-سايد — لا واجهة فقط). الإحداثيات تُقرَّب ~150م ولا تصل للواجهة
 * إطلاقًا. القراءة وحدها متاحة بلا موقع.
 */
export async function POST(req: NextRequest) {
  const uid = await authUid(req.headers.get('authorization'));
  if (!uid) {
    return NextResponse.json({ error: 'تسجيل الدخول مطلوب للإرسال' }, { status: 401 });
  }
  const limited = await checkRateLimitShared(
    `post-create:${uid}:${getRequestIp(req.headers)}`,
    POST_CREATE_RATE.max,
    POST_CREATE_RATE.windowMs
  );
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'أرسلت عدة منشورات — انتظر قليلًا ثم حاول مجددًا' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  let body: { text?: unknown; lat?: unknown; lng?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length < 2 || text.length > MAX_TEXT) {
    return NextResponse.json({ error: 'المنشور يجب أن يكون بين 2 و 500 حرف' }, { status: 400 });
  }

  const lat = typeof body.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
  const lng = typeof body.lng === 'number' && Number.isFinite(body.lng) ? body.lng : null;
  if (lat === null || lng === null) {
    return NextResponse.json({ error: 'النشر يتطلب تفعيل موقعك — فعّله أولًا' }, { status: 400 });
  }
  if (!inEgyptBounds(lat, lng)) {
    return NextResponse.json({ error: 'الموقع المحدد خارج مصر — النشر متاح من داخل مصر' }, { status: 400 });
  }

  // مكان المُرسل يُحدَّد من إحداثياته حصرًا (أقرب مكان معروف).
  const place = nearestPlace(lat, lng);
  const city = place?.name ?? null;
  const governorate = place?.governorate ?? null;
  const neighborhoodId = place ? neighborhoodKey(place.name, place.governorate) : null;

  // الإحداثيات المخزنة فقط (مقرّبة) — تُستخدم للفلترة السيرفر-سايد، لا للعرض.
  const rlat = roundCoordinate(lat, -90, 90);
  const rlng = roundCoordinate(lng, -180, 180);
  const cell = cellKey(rlat, rlng);

  try {
    const db = getAdminDb();
    const now = Date.now();
    const doc: Omit<CommunityPostDoc, 'id'> = {
      city,
      governorate,
      neighborhoodId,
      area: city,
      userId: uid,
      displayName: generateAnonymousName(uid),
      text,
      createdAt: now,
      upCount: 0,
      downCount: 0,
      netVotes: 0,
      numComments: 0,
      status: 'open',
      lat: rlat,
      lng: rlng,
      cell,
    };
    const ref = await db.collection('posts').add(doc);
    const view = docToPostView({ id: ref.id, ...doc });
    return NextResponse.json({ post: view }, { status: 201 });
  } catch (err) {
    console.error('Post create failed:', err);
    return NextResponse.json({ error: 'تعذر حفظ المنشور' }, { status: 500 });
  }
}
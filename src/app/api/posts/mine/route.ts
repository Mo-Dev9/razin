import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { authUid } from '@/lib/api-auth';
import { checkRateLimit, getRequestIp } from '@/lib/rate-limit';
import type { CommunityPostDoc } from '@/types';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MINE_READ_RATE = { max: 30, windowMs: 60_000 };

/** منشورات المستخدم كما يراها لنفسه: نص/أصوات/تعليقات/حالة فقط — لا إحداثيات ولا هوية أحد. */
interface MinePostView {
  id: string;
  text: string;
  createdAt: number;
  upCount: number;
  downCount: number;
  netVotes: number;
  numComments: number;
  status: CommunityPostDoc['status'];
  neighborhoodId: string | null;
  city: string | null;
}

/**
 * «منشوراتي» في صفحة الملف الشخصي: يعيد منشورات الرمز المجهول صاحبه (Bearer)
 * مرتبة بالأحدث. القراءة من Firestore هنا فقط عبر Admin SDK لأن القواعد تمنع
 * قراءة posts من العميل إطلاقًا (قرار الخصوصية ٦). الناتج لا يحمل إحداثيات ولا
 * اسم المستخدم الحقيقي — الاسم المعروض هو الاسم المستعار الثابت للجهاز.
 */
export async function GET(req: NextRequest) {
  const uid = await authUid(req.headers.get('authorization'));
  if (!uid) {
    return NextResponse.json({ error: 'تسجيل الدخول مطلوب — حدّث الصفحة' }, { status: 401 });
  }
  const limited = checkRateLimit(
    `post-mine:${uid}:${getRequestIp(req.headers)}`,
    MINE_READ_RATE.max,
    MINE_READ_RATE.windowMs
  );
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'طلبات كثيرة — انتظر قليلًا ثم حاول مجددًا' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  const raw = req.nextUrl.searchParams.get('limit');
  const n = raw === null || raw === '' ? Number.NaN : Number(raw);
  const limit = Number.isFinite(n) ? Math.max(1, Math.min(MAX_LIMIT, Math.round(n))) : DEFAULT_LIMIT;

  try {
    const db = getAdminDb();
    const snap = await db
      .collection('posts')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    const posts: MinePostView[] = snap.docs.map((d) => {
      const x = d.data() as Partial<CommunityPostDoc>;
      const up = typeof x.upCount === 'number' ? x.upCount : 0;
      const down = typeof x.downCount === 'number' ? x.downCount : 0;
      return {
        id: d.id,
        text: typeof x.text === 'string' ? x.text : '',
        createdAt: typeof x.createdAt === 'number' ? x.createdAt : 0,
        upCount: up,
        downCount: down,
        netVotes: typeof x.netVotes === 'number' ? x.netVotes : up - down,
        numComments: typeof x.numComments === 'number' ? x.numComments : 0,
        status: x.status === 'hidden' ? 'hidden' : 'open',
        neighborhoodId: typeof x.neighborhoodId === 'string' ? x.neighborhoodId : null,
        city: typeof x.city === 'string' ? x.city : null,
      };
    });
    return NextResponse.json({ posts, count: posts.length });
  } catch (err) {
    console.error('My posts fetch failed:', err);
    // (مرجح) فشل الاستعلام غالبًا لفهرس مفقود أو مشكلة اتصال — الرسالة عامة عن عمد.
    return NextResponse.json({ error: 'تعذر تحميل منشوراتك — حاول لاحقًا' }, { status: 500 });
  }
}
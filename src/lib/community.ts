import type { ProximityKind, PostView } from '@/types';
import { haversineKm } from '@/lib/proximity';
import { EGYPT_GOVERNORATES } from '@/lib/egypt-cities';

/**
 * منطق «حارة» الخالص (§رؤية المنتج): مجتمع حي مجهول يخدم فكرة الأرقام —
 * منشور نصوص يظهر حول المستخدم بمدى ثابت، مع تسمية قرب نصية فقط (لا إحداثيات
 * للواجهة إطلاقًا) وترتيب «ساخن» يحافظ على حيوية القائمة الدائمة.
 * كل التوابع نقية (Pure) وقابلة لاختبارات سلوكية.
 */

/** مدى ظهور منشورات الحارة حول المستخدم بالكيلومترات. */
export const POST_RADIUS_KM = 10;

/** فئات القرب النصية: داخلها الفئة، خارجها «بعيد» (ولا يظهر أصلًا في التدفق). */
export const HERE_KM = 1;
export const VERY_CLOSE_KM = 2;

/**
 * خطوة تقريب الإحداثيات عند التخزين (~150م²): لا يحمل الخادم موقعك الدقيق،
 * ومع ذلك تبقى الفئات الثلاث (هنا/قريب جدًا/قريب) قابلة للتمييز بدقة كافية.
 */
const PRIVACY_ROUND_STEP = 0.0014;

/** حجم خلية الاستعلام الجغرافي بالدرجات (~11 كم) — لتقليل خيارات فهرسة Firestore. */
const CELL_SIZE_DEG = 0.1;

export interface NearestPlace {
  name: string;
  governorate: string;
  distKm: number;
}

/** أقرب مكان معروف (من جدول egypt-cities) ضمن المدى — وإلا null. */
export function nearestPlace(lat: number, lng: number, maxKm: number = POST_RADIUS_KM): NearestPlace | null {
  let best: NearestPlace | null = null;
  for (const gov of EGYPT_GOVERNORATES) {
    for (const p of gov.places) {
      const d = haversineKm(lat, lng, p.lat, p.lng);
      if (d <= maxKm && (!best || d < best.distKm)) {
        best = { name: p.name, governorate: gov.name, distKm: d };
      }
    }
  }
  return best;
}

/** فئة قرب نصية من مسافة الكيلومترات — القاعدة الفاصلة بين الفئات. */
export function distanceBucketKm(km: number): ProximityKind {
  if (km <= HERE_KM) return 'here';
  if (km <= VERY_CLOSE_KM) return 'veryClose';
  if (km <= POST_RADIUS_KM) return 'close';
  return 'far';
}

const BASE_LABELS: Readonly<Record<ProximityKind, string | null>> = {
  here: 'هنا',
  veryClose: 'قريب جدًا',
  close: 'قريب',
  far: 'بعيد',
  unknown: null,
};

/**
 * تسمية البطاقة: الفئة النصية + اسم حيّ المُرسِل حين يكون قريبًا ومعروفًا.
 * «unknown» (بلا موقع) = بلا تسمية إطلاقًا — لا نكشف شيئًا.
 */
export function postBadge(kind: ProximityKind, area: string | null): { kind: ProximityKind; label: string | null } {
  const base = BASE_LABELS[kind];
  if (base === null || kind === 'far' || kind === 'unknown') return { kind, label: base };
  return { kind, label: area ? `${base} · ${area}` : base };
}

/** تقريب إحداثية لأغراض الخصوصية (~150م) — النتيجة دائمًا داخل المدى. */
export function roundCoordinate(value: number, min: number, max: number): number {
  const rounded = Math.round(value / PRIVACY_ROUND_STEP) * PRIVACY_ROUND_STEP;
  return Math.max(min, Math.min(max, rounded));
}

/**
 * حدود مصر التقريبية (شاملة الشواطئ والحدود القريبة بحرًا) — القرار الجديد:
 * النشر يتطلب موقعًا **إجباريًا داخل هذه الحدود** (سيرفر-سايد لا واجهة فقط)،
 * ليمنع المنشورات الشبح (بلا موقع/خارج مصر) من تلويث تدفق القرب.
 */
export const EGYPT_BOUNDS = { latMin: 21.8, latMax: 31.9, lngMin: 24.5, lngMax: 37.0 };

/** هل النقطة المحددة داخل حدود مصر؟ */
export function inEgyptBounds(lat: number, lng: number): boolean {
  return (
    lat >= EGYPT_BOUNDS.latMin &&
    lat <= EGYPT_BOUNDS.latMax &&
    lng >= EGYPT_BOUNDS.lngMin &&
    lng <= EGYPT_BOUNDS.lngMax
  );
}

/** مفتاح خلية الخريطة التقريبي لمنشور مخزن. */
export function cellKey(lat: number, lng: number): string {
  const li = Math.floor(lat / CELL_SIZE_DEG);
  const lg = Math.floor(lng / CELL_SIZE_DEG);
  return `${li}_${lg}`;
}

/**
 * كل خلايا الخريطة التي تمسّ دائرة نصف قطرها radiusKm حول النقطة — بانتظار
 * فلتر المسافة الدقيق. حجم الخلية 0.1° (~11 كم) يبقي العدد ≤ 9 (تحت حد `in`).
 * حارس أمان: cos(lat)→0 عند القطبين يضخّم dLng إلى ما لا نهاية (كان يعلّق
 * الخادم بـ lat=90). نُثبّت حدًا أدنى للمُجمّل ونرفض أي موضع يعطي أكثر من ٩
 * خلايا (خارج نطاق حارة مصر — قراءة عامة بلا منشورات قريبة = نتيجة فارغة).
 */
export function candidateCells(lat: number, lng: number, radiusKm: number): string[] {
  // سقف أمان: لا نسمح بمرور انفجار dLng عند القطبين
  const cosLat = Math.max(Math.abs(Math.cos((lat * Math.PI) / 180)), 0.05);
  const dLat = Math.min(radiusKm / 111, Math.PI);
  const dLng = Math.min(radiusKm / (111 * cosLat), 2 * Math.PI);
  const minLi = Math.floor((lat - dLat) / CELL_SIZE_DEG);
  const maxLi = Math.floor((lat + dLat) / CELL_SIZE_DEG);
  const minLg = Math.floor((lng - dLng) / CELL_SIZE_DEG);
  const maxLg = Math.floor((lng + dLng) / CELL_SIZE_DEG);
  const cells: string[] = [];
  for (let li = minLi; li <= maxLi; li++) {
    for (let lg = minLg; lg <= maxLg; lg++) {
      cells.push(`${li}_${lg}`);
    }
    // حارس عدد الاستعلام: فوق حد `in` (10) لا جدوى فورية → نتيجة فارغة
    if (cells.length > 9) return [];
  }
  return cells;
}

/**
 * الترتيب «الساخن» للتدفق الدائم: الأصوات تُشبع لوغاريتميًا (صوت إضافي ذو
 * قيمة أقل)، والتعليقات ترفع قليلًا، والحداثة تذبل أسيًا خلال ~يوم. يمنع
 * المنشور القديم الضخم من تجميد الصدارة أبدًا ويبقي الجديد الحي نشطًا.
 */
export function hotScore(
  p: { upCount: number; downCount: number; numComments: number; createdAt: number },
  now: number = Date.now()
): number {
  const net = (p.upCount ?? 0) - (p.downCount ?? 0);
  const votesTerm = net >= 1 ? 40 * Math.log10(net) : net <= -1 ? -40 * Math.log10(-net) : 0;
  const commentsTerm = (p.numComments ?? 0) * 3;
  const ageHours = Math.max(0, (now - (p.createdAt ?? now)) / 3_600_000);
  const recencyBonus = 40 * Math.exp(-ageHours / 24);
  return votesTerm + commentsTerm + recencyBonus;
}

/**
 * حساب أثر تصويت على المنشور: prev = تصويت الرمز الحالي (1/-1/0)، requested
 * = المطلوب من الواجهة. القاعدة: تكرار نفس الاتجاه ⇔ إلغاء (0)؛ طلب 0 = إلغاء؛
 * أي تغيير آخر يسجَّل. يعيد الاتجاه الجديد وأثر صافي الدلتا على العدادات.
 */
export function computeVoteDelta(
  prev: number,
  requested: number
): { next: -1 | 0 | 1; upDelta: number; downDelta: number } {
  const prevNorm: -1 | 0 | 1 = prev === 1 || prev === -1 ? prev : 0;
  const req: -1 | 0 | 1 = requested === 1 || requested === -1 ? requested : 0;
  const next: -1 | 0 | 1 = req !== 0 && prevNorm !== req ? req : 0;
  const upDelta = (next === 1 ? 1 : 0) - (prevNorm === 1 ? 1 : 0);
  const downDelta = (next === -1 ? 1 : 0) - (prevNorm === -1 ? 1 : 0);
  return { next, upDelta, downDelta };
}

interface DocFields {
  id: string;
  lat?: number | null;
  lng?: number | null;
  area?: string | null;
  city?: string | null;
  neighborhoodId?: string | null;
  displayName: string;
  text: string;
  createdAt: number;
  upCount?: number | null;
  downCount?: number | null;
  netVotes?: number | null;
  numComments?: number | null;
  isGuide?: boolean | null;
}

export interface PostViewOptions {
  userLat?: number | null;
  userLng?: number | null;
  myVote?: -1 | 0 | 1;
}

/** عدد المشاركات الإرشادية المعروضة في أول صفحة «حارة» (قرار ٤). */
export const GUIDE_SLOT_COUNT = 3;

/**
 * تحويل مستند منشور مخزن إلى عرض الواجهة (PostView): لا إحداثيات ولا هوية
 * إطلاقًا — فقط تسمية قرب نصية حسب موقع القارئ إن وُفر. الواجهة لا ترى
 * أي شيء آخر (قرار «لا موقع دقيق لأي من الطرفين»).
 */
export function docToPostView(doc: DocFields, opts: PostViewOptions = {}): PostView {
  const hasUser = opts.userLat != null && opts.userLng != null;
  const hasPostCoords = typeof doc.lat === 'number' && typeof doc.lng === 'number';
  let kind: ProximityKind = 'unknown';
  if (hasUser && hasPostCoords) {
    const km = haversineKm(opts.userLat as number, opts.userLng as number, doc.lat as number, doc.lng as number);
    kind = distanceBucketKm(km);
  }
  const badge = postBadge(kind, doc.area ?? null);
  const up = doc.upCount ?? 0;
  const down = doc.downCount ?? 0;
  return {
    id: doc.id,
    text: doc.text,
    displayName: doc.displayName,
    createdAt: doc.createdAt,
    upCount: up,
    downCount: down,
    netVotes: doc.netVotes ?? up - down,
    numComments: doc.numComments ?? 0,
    city: doc.city ?? null,
    neighborhoodId: doc.neighborhoodId ?? null,
    kind: badge.kind,
    badgeLabel: badge.label,
    myVote: opts.myVote ?? 0,
    isGuide: doc.isGuide === true,
  };
}
import { describe, it, expect } from 'vitest';
import {
  POST_RADIUS_KM,
  distanceBucketKm,
  postBadge,
  roundCoordinate,
  inEgyptBounds,
  cellKey,
  candidateCells,
  hotScore,
  computeVoteDelta,
  nearestPlace,
} from '@/lib/community';

describe('distanceBucketKm', () => {
  it('تصنيف المسافات داخل الفئات الثلاث وبعدها', () => {
    expect(distanceBucketKm(0)).toBe('here');
    expect(distanceBucketKm(0.8)).toBe('here');
    expect(distanceBucketKm(1)).toBe('here');
    expect(distanceBucketKm(1.5)).toBe('veryClose');
    expect(distanceBucketKm(2)).toBe('veryClose');
    expect(distanceBucketKm(5)).toBe('close');
    expect(distanceBucketKm(POST_RADIUS_KM)).toBe('close');
    expect(distanceBucketKm(POST_RADIUS_KM + 0.1)).toBe('far');
  });
});

describe('postBadge', () => {
  it('يضيف اسم الحي للفئات القريبة فقط', () => {
    expect(postBadge('here', 'مدينة نصر')).toEqual({ kind: 'here', label: 'هنا · مدينة نصر' });
    expect(postBadge('veryClose', 'المعادي')).toEqual({ kind: 'veryClose', label: 'قريب جدًا · المعادي' });
    expect(postBadge('close', '6 أكتوبر')).toEqual({ kind: 'close', label: 'قريب · 6 أكتوبر' });
  });

  it('لا يكشف شيئًا في بعيد/مجهول وبلا حي', () => {
    expect(postBadge('far', 'مدينة نصر').label).toBe('بعيد');
    expect(postBadge('unknown', 'مدينة نصر').label).toBeNull();
    expect(postBadge('here', null)).toEqual({ kind: 'here', label: 'هنا' });
  });
});

describe('roundCoordinate', () => {
  it('يقرّب ضمن مدى ~150م ولا يخرج عن حدود صحيحة', () => {
    const r = roundCoordinate(30.0453, -90, 90);
    expect(Math.abs(r - 30.0453)).toBeLessThan(0.0015);
    expect(r).toBeGreaterThanOrEqual(-90);
    expect(r).toBeLessThanOrEqual(90);
    const out = roundCoordinate(300, -90, 90);
    expect(out).toBe(90);
  });
});

describe('cellKey + candidateCells', () => {
  it('مفتاح خلية ثابت للتحقق الجيوديسي', () => {
    expect(cellKey(30.04, 31.25)).toBe(cellKey(30.05, 31.26));
  });

  it('يولّد خلايا تحوي نقطة المركز واحصر نطاقها عند مدى 10 كم', () => {
    const cells = candidateCells(30.04, 31.24, POST_RADIUS_KM);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.length).toBeLessThanOrEqual(9);
    expect(cells).toContain(cellKey(30.04, 31.24));
    // خلية بعيدة بـ 30 كم خارج النطاق لا تظهر
    expect(cells).not.toContain(cellKey(30.04, 31.65));
  });

  it('لا يعلّق ولا ينفجر عند القطبين (DoS guard: cos→0 يجعل dLng ضخمًا)', () => {
    const start = Date.now();
    const atPole = candidateCells(90, 30, POST_RADIUS_KM);
    const atNegPole = candidateCells(-90, 30, POST_RADIUS_KM);
    const elapsed = Date.now() - start;
    expect(atPole.length).toBeLessThanOrEqual(9);
    expect(atNegPole.length).toBeLessThanOrEqual(9);
    expect(elapsed).toBeLessThan(1000); // يعود فورًا — لا حلقة قاتلة
  });

  it('خارج نطاق فرز مصر يعطي نتيجة فارغة بدل حلقات ضخمة', () => {
    const far = candidateCells(60, 30, POST_RADIUS_KM);
    expect(far.length).toBeLessThanOrEqual(9);
  });
});

describe('hotScore', () => {
  const now = 1_700_000_000_000;
  it('جديد بتفاعل نشط يتفوق على قديم بأصوات أكثر', () => {
    const fresh = hotScore({ upCount: 3, downCount: 0, numComments: 2, createdAt: now - 60_000 }, now);
    const stale = hotScore({ upCount: 30, downCount: 0, numComments: 0, createdAt: now - 3 * 24 * 3_600_000 }, now);
    expect(fresh).toBeGreaterThan(stale);
  });

  it('التصويتات السلبية تخفض الرتبة والتعليقات ترفعها', () => {
    const neg = hotScore({ upCount: 1, downCount: 20, numComments: 0, createdAt: now }, now);
    const commented = hotScore({ upCount: 1, downCount: 0, numComments: 5, createdAt: now }, now);
    expect(neg).toBeLessThan(commented);
  });

  it('العمر يذبل التدريج وليس بشكل قطعي', () => {
    const a = hotScore({ upCount: 5, downCount: 0, numComments: 0, createdAt: now - 3_600_000 }, now);
    const b = hotScore({ upCount: 5, downCount: 0, numComments: 0, createdAt: now }, now);
    expect(b).toBeGreaterThan(a);
    expect(a).toBeGreaterThan(0);
  });
});

describe('computeVoteDelta', () => {
  it('إضافة ثم تكرار نفس الاتجاه = إلغاء', () => {
    expect(computeVoteDelta(0, 1)).toEqual({ next: 1, upDelta: 1, downDelta: 0 });
    expect(computeVoteDelta(1, 1)).toEqual({ next: 0, upDelta: -1, downDelta: 0 });
  });

  it('تبديل الاتجاه يحدّث العدّادين', () => {
    expect(computeVoteDelta(1, -1)).toEqual({ next: -1, upDelta: -1, downDelta: 1 });
  });

  it('طلب 0 يحذف أي تصويت سابق', () => {
    expect(computeVoteDelta(1, 0)).toEqual({ next: 0, upDelta: -1, downDelta: 0 });
    expect(computeVoteDelta(0, 0)).toEqual({ next: 0, upDelta: 0, downDelta: 0 });
  });

  it('يتجاهل القيم غير الصالحة كـ absent', () => {
    expect(computeVoteDelta(1, 99)).toEqual({ next: 0, upDelta: -1, downDelta: 0 });
    expect(computeVoteDelta(-1, -1)).toEqual({ next: 0, upDelta: 0, downDelta: -1 });
  });
});

describe('nearestPlace', () => {
  it('يعيد أقرب مكان معروف ضمن المدى ويصمت خارجه', () => {
    // وسط مدينة نصر (داخل جمهورية جدول الأماكن)
    const p = nearestPlace(30.0453, 31.3542, 10);
    expect(p?.name).toBe('مدينة نصر');
    expect(p?.governorate).toBe('القاهرة');
    // منتصف الصحراء بعيد عن كل الأماكن
    expect(nearestPlace(29.5, 28, 10)).toBeNull();
  });
});

describe('inEgyptBounds — حارس النشر (موقع إجباري داخل مصر)', () => {
  it('يقبل المدن المصرية الواقعية على أطراف البلاد', () => {
    // القاهرة
    expect(inEgyptBounds(30.0444, 31.2357)).toBe(true);
    // أسوان (أقصى الجنوب)
    expect(inEgyptBounds(24.0889, 32.8998)).toBe(true);
    // الإسكندرية (ساحل شمالي)
    expect(inEgyptBounds(31.2001, 29.9187)).toBe(true);
    // السويس (شرق)
    expect(inEgyptBounds(29.9669, 32.5498)).toBe(true);
    // حلايب (جنوب شرق الحدود)
    expect(inEgyptBounds(22.22, 36.64)).toBe(true);
  });

  it('يرفض مواقع خارج مصر (نشط/خارج النطاق)', () => {
    // النقطة صفر — مرفوضة (ليست مصرية)
    expect(inEgyptBounds(0, 0)).toBe(false);
    // باريس ولندن ونيويورك
    expect(inEgyptBounds(48.8566, 2.3522)).toBe(false);
    expect(inEgyptBounds(51.5074, -0.1278)).toBe(false);
    expect(inEgyptBounds(40.7128, -74.006)).toBe(false);
    // القاهرة بإحداثية مقلوبة (خط طول خارج مصر)
    expect(inEgyptBounds(30.0444, 50)).toBe(false);
  });
});
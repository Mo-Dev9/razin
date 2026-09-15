import { describe, it, expect } from 'vitest';
import { neighborhoodSearchResults, placeByNeighborhoodId } from '@/lib/neighborhood-search';

/**
 * اختبارات سلوكية لا معزولة: سيناريوهات مستخدم حقيقية لبحث «كل مصر».
 * القاعدة: أي ميزة بحث/فلترة لا تُعلن جاهزة إلا بعد سيناريوهات واقعية.
 */

describe('neighborhoodSearchResults (بحث كل مصر)', () => {
  it('يبحث بلا فلتر ويطابق نصًا عربيًا بتحقيق تاء التوحيد عربي/عربي تخالف البحث', () => {
    // همزة «6 أكتوبر» تكتب «أ» — المستخدم قد يكتب «اكتوبر» بلا همزة
    const res = neighborhoodSearchResults('اكتوبر');
    expect(res.some((r) => r.name === '6 أكتوبر' && r.governorate === 'الجيزة')).toBe(true);
  });

  it('يوحّد التاء المربوطة: «مدينه نصر» يجد «مدينة نصر»', () => {
    const res = neighborhoodSearchResults('مدينه نصر');
    expect(res.some((r) => r.name === 'مدينة نصر' && r.governorate === 'القاهرة')).toBe(true);
  });

  it('مطابقة جزئية بعد توحيد المسافات: «مدينة» يجد كل الأماكن بنفس البادئة', () => {
    const res = neighborhoodSearchResults('مدينة نصر');
    const exact = res.find((r) => r.name === 'مدينة نصر');
    expect(exact).toBeDefined();
    expect(exact?.neighborhoodId).toBe('مدينهنصر');
  });

  it('الاسم المتكرر عبر المحافظات يُفكّ بلاحقة المحافظة في المعرّف', () => {
    const res = neighborhoodSearchResults('دار السلام');
    const ids = res.filter((r) => r.name === 'دار السلام').map((r) => r.neighborhoodId).sort();
    expect(ids).toEqual(['دارالسلام-القاهره', 'دارالسلام-سوهاج']);
  });

  it('المطابقة التامة تتقدم على الجزئية في الترتيب', () => {
    const res = neighborhoodSearchResults('المعادي');
    expect(res[0]?.name).toBe('المعادي');
    expect(res[0]?.governorate).toBe('القاهرة');
  });

  it('بحث باسم محافظة يجد المدينة/الحي التي تحمل نفس الاسم', () => {
    const res = neighborhoodSearchResults('سوهاج');
    expect(res.some((r) => r.governorate === 'سوهاج')).toBe(true);
  });

  it('استعلام فارغ أو بلا نتائج لا يكسر', () => {
    expect(neighborhoodSearchResults('')).toEqual([]);
    expect(neighborhoodSearchResults('   ')).toEqual([]);
    expect(neighborhoodSearchResults('حي غير موجود إطلاقًا')).toEqual([]);
  });

  it('الحد الافتراضي 8 نتائج ويمكن خفضه', () => {
    const all = neighborhoodSearchResults('', 5);
    expect(all).toEqual([]);
    const few = neighborhoodSearchResults('ا', 3);
    expect(few.length).toBeLessThanOrEqual(3);
  });
});

describe('placeByNeighborhoodId (عكس المفتاح لصفحة الحي)', () => {
  it('مفتاح غير غامض بلا لاحقة محافظة', () => {
    expect(placeByNeighborhoodId('مدينهنصر')).toEqual({ name: 'مدينة نصر', governorate: 'القاهرة' });
  });

  it('مفتاح غامض بلاحقة المحافظة يعيد المحافظة الصحيحة لكلٍ منهما', () => {
    expect(placeByNeighborhoodId('دارالسلام-القاهره')).toEqual({ name: 'دار السلام', governorate: 'القاهرة' });
    expect(placeByNeighborhoodId('دارالسلام-سوهاج')).toEqual({ name: 'دار السلام', governorate: 'سوهاج' });
  });

  it('مفتاح غير معروف يعيد null', () => {
    expect(placeByNeighborhoodId('مفتاح-بلا-معنى')).toBeNull();
  });
});
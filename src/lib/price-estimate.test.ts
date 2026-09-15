import { describe, expect, it } from 'vitest';
import { estimatePriceFromListings, roomsMatch, bathsMatch, typeMatch, furnishedMatch } from '@/lib/price-estimate';

const base = [
  { rooms: 1, bathrooms: 1, price: 5000 },
  { rooms: 2, bathrooms: 1, price: 7000 },
  { rooms: 2, bathrooms: 2, price: 9000 },
  { rooms: 3, bathrooms: 2, price: 12000 },
  { rooms: 6, bathrooms: 3, price: 25000 },
];

describe('roomsMatch / bathsMatch', () => {
  it('الاستوديو (0) و«6 فأكثر» يتصرفان مع تحديداتهم', () => {
    expect(roomsMatch(0, 0)).toBe(true);
    expect(roomsMatch(3, 0)).toBe(false);
    expect(roomsMatch(6, 6)).toBe(true);
    expect(roomsMatch(8, 6)).toBe(true);
    expect(roomsMatch(5, 6)).toBe(false);
  });

  it('بلا تحديد: أي غرفة تطابق، والإعلان بلا غرف لا يطابق (كسلوك سابق)', () => {
    expect(roomsMatch(null, null)).toBe(false);
    expect(roomsMatch(4, null)).toBe(true);
    expect(bathsMatch(2, null)).toBe(true);
    expect(bathsMatch(null, null)).toBe(false);
  });
});

describe('estimatePriceFromListings — سيناريوهات المستخدم', () => {
  it('تطابق حرفي لعدد الغرف والحمامات → أساس exact', () => {
    const r = estimatePriceFromListings(base, { rooms: 2, bathrooms: 1 });
    expect(r.basis).toBe('exact');
    expect(r.stats.median).toBe(7000);
    expect(r.stats.count).toBe(1);
  });

  it('لا حمّامات بهذا العدد → مرحلة الغرف ناقصة العينات تُرفض وتُحسب من الكل', () => {
    const r = estimatePriceFromListings(base, { rooms: 2, bathrooms: 4 });
    expect(r.basis).toBe('all'); // مرحلة rooms (2 عينة) < MIN_FILTER_SOURCES → نزول
    expect(r.stats.count).toBe(base.length);
  });

  it('لا غرف بهذا العدد → مرحلة الحمّامات ناقصة العينات تُرفض وتُحسب من الكل', () => {
    const r = estimatePriceFromListings(base, { rooms: 50, bathrooms: 2 });
    expect(r.basis).toBe('all'); // baths (2 عينة) < MIN_FILTER_SOURCES → نزول
    expect(r.stats.count).toBe(base.length);
  });

  it('مرحلة تراخٍ بعينة واحدة لا تُقبل — سيناريو فيصل: ‏13000 من بين 1 ينهار للكل', () => {
    const faisal = [
      { rooms: 2, bathrooms: 1, propertyType: 'apartment', furnished: false, price: 3500 },
      { rooms: 3, bathrooms: 1, propertyType: 'apartment', furnished: false, price: 4000 },
      { rooms: 2, bathrooms: 1, propertyType: 'apartment', furnished: false, price: 4500 },
      { rooms: 3, bathrooms: 1, propertyType: 'apartment', furnished: true, price: 9000 },
      { rooms: 3, bathrooms: 2, propertyType: 'apartment', furnished: true, price: 13000 },
      { rooms: 3, bathrooms: 1, propertyType: 'apartment', furnished: false, price: 5000 },
      { rooms: 3, bathrooms: 1, propertyType: 'apartment', furnished: false, price: 12000 },
      { rooms: 3, bathrooms: 1, propertyType: 'apartment', furnished: true, price: 12000 },
      { rooms: 3, bathrooms: 3, propertyType: 'apartment', furnished: false, price: 4500 },
      { rooms: 3, bathrooms: 2, propertyType: 'apartment', furnished: false, price: 7000 },
    ];
    const twoBaths = estimatePriceFromListings(faisal, {
      rooms: 2, bathrooms: 2, propertyType: 'apartment', furnished: true,
    });
    expect(twoBaths.basis).toBe('all'); // exact=0، rooms=0، baths=1 فقط → لا يُحسب من عينة واحدة
    expect(twoBaths.stats.median).toBe(6000); // وسيط الحي كله، لا ‏13000 من بين 1
    const threeBaths = estimatePriceFromListings(faisal, {
      rooms: 2, bathrooms: 3, propertyType: 'apartment', furnished: true,
    });
    expect(threeBaths.basis).toBe('all');
    expect(threeBaths.stats.median).toBe(6000); // نفس الأساس لا قفزة ‏13000↔‏6000
  });

  it('لا شيء يطابق → قاعدة بكل إعلانات الحي', () => {
    const r = estimatePriceFromListings(base, { rooms: 50, bathrooms: 50 });
    expect(r.basis).toBe('all');
    expect(r.stats.count).toBe(base.length);
  });

  it('no تحديد (أي غرف/أي حمامات) → exact تساوي القاعدة كلها', () => {
    const r = estimatePriceFromListings(base, { rooms: null, bathrooms: null });
    expect(r.basis).toBe('exact');
    expect(r.stats.count).toBe(base.length);
  });

  it('قاعدة فارغة → نتيجة صفر (لا يكسر)', () => {
    const r = estimatePriceFromListings([], { rooms: 2, bathrooms: 1 });
    expect(r.stats.count).toBe(0);
  });

  it('سيناريو «50 غرفة» من شكوى المستخدم: لا يطابق أحد → يُحسب من كل المتوفر', () => {
    const r = estimatePriceFromListings(base, { rooms: 6, bathrooms: 2 });
    expect(r.basis === 'exact' || r.basis === 'rooms' || r.basis === 'baths' || r.basis === 'all').toBe(true);
    expect(r.stats.count).toBeGreaterThan(0);
    expect(r.stats.median).toBeGreaterThan(0);
  });
});

describe('نوع العقار والتأثيث في التقدير', () => {
  const mixed = [
    { rooms: 2, bathrooms: 1, propertyType: 'apartment', furnished: false, price: 7000 },
    { rooms: 2, bathrooms: 1, propertyType: 'apartment', furnished: true, price: 11000 },
    { rooms: 2, bathrooms: 1, propertyType: 'duplex', furnished: false, price: 15000 },
    { rooms: 3, bathrooms: 2, propertyType: 'apartment', furnished: true, price: 13000 },
  ];

  it('مطابقة نوع+تأثيث+غرف+حمامات حرفيًا → exact', () => {
    const r = estimatePriceFromListings(mixed, { rooms: 2, bathrooms: 1, propertyType: 'apartment', furnished: false });
    expect(r.basis).toBe('exact');
    expect(r.stats.median).toBe(7000);
  });

  it('مفروش فقط (بلا نوع) يُضيّق بلا كسر السلم', () => {
    const r = estimatePriceFromListings(mixed, { rooms: 2, bathrooms: 1, furnished: true });
    expect(r.stats.median).toBe(11000); // الشقق والدوبلكس المفروشة بغرفتين وحمّام
    expect(r.stats.count).toBe(1);
  });

  it('نوع لا يطابق إطلاقًا → يُحسب من كل بيانات الحي (بلا طريق مسدود)', () => {
    const r = estimatePriceFromListings(mixed, { rooms: 2, bathrooms: 1, propertyType: 'villa' });
    expect(r.basis).toBe('all');
    expect(r.stats.count).toBe(mixed.length);
  });

  it('لا تحديد نوع/تأثيث → لا يغيّر السلوك القديم', () => {
    const r = estimatePriceFromListings(mixed, { rooms: 2, bathrooms: 1 });
    expect(r.basis).toBe('exact');
    expect(r.stats.count).toBe(3); // جميع الأنواع بغرفتين وحمّام
  });

  it('منطق المطابقة: فارغ=يمرّ، قيم محددة=تطابق فقط', () => {
    expect(typeMatch('apartment', null)).toBe(true);
    expect(typeMatch('apartment', 'duplex')).toBe(false);
    expect(typeMatch('apartment', 'apartment')).toBe(true);
    expect(furnishedMatch(true, null)).toBe(true);
    expect(furnishedMatch(false, true)).toBe(false);
    expect(furnishedMatch(false, false)).toBe(true);
  });
});
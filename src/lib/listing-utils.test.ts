import { describe, it, expect } from 'vitest';
import { neighborhoodKey, placeNameIsAmbiguous, resolveListingLocation, resolveEnPlace, listingDedupKey, resolvePlaceFromSearchUrl } from '@/lib/listing-utils';

describe('neighborhoodKey', () => {
  it('removes spaces and normalizes hamza/ta marbuta', () => {
    const key = neighborhoodKey('زهراء المعادي');
    expect(key).toBe('زهراءالمعادي');
  });

  it('keeps the same key when governorate is given but name is unique', () => {
    const base = neighborhoodKey('المعادي');
    const withGov = neighborhoodKey('المعادي', 'القاهرة');
    expect(base).toBe(withGov);
  });

  it('adds a governorate suffix for genuinely ambiguous names', () => {
    const key1 = neighborhoodKey('دار السلام', 'القاهرة');
    const key2 = neighborhoodKey('دار السلام', 'سوهاج');
    expect(key1).toBe('دارالسلام-القاهره');
    expect(key2).toBe('دارالسلام-سوهاج');
    expect(key1).not.toBe(key2);
  });
});

describe('placeNameIsAmbiguous', () => {
  it('returns true for «دار السلام»', () => {
    expect(placeNameIsAmbiguous('دار السلام')).toBe(true);
  });

  it('returns false for a random non-colliding city', () => {
    expect(placeNameIsAmbiguous('حي ليس موجود')).toBe(false);
  });
});

describe('resolveListingLocation', () => {
  it('canonicalizes a known city when no governorate is provided', () => {
    const resolved = resolveListingLocation('دار السلام', null);
    expect(resolved.matched).toBe(true);
    expect(resolved.governorate).toBe('القاهرة');
    expect(resolved.city).toBe('دار السلام');
    expect(resolved.neighborhoodId).toBe('دارالسلام-القاهره');
  });

  it('falls back to raw city and fallback governorate when nothing matches', () => {
    const resolved = resolveListingLocation('حي كويس جدا', null);
    expect(resolved.matched).toBe(false);
    expect(resolved.city).toBe('حي كويس جدا');
    expect(resolved.governorate).toBe('غير محدد');
    expect(resolved.neighborhoodId).toBe('حيكويسجدا');
  });

  it('uses the fallback «غير محدد» when all inputs are null', () => {
    const resolved = resolveListingLocation(null, null);
    expect(resolved.matched).toBe(false);
    expect(resolved.city).toBe('غير محدد');
    expect(resolved.neighborhoodId).toBe('غيرمحدد');
    expect(resolved.governorate).toBe('غير محدد');
  });
});

describe('resolveListingLocation — أسماء المصدر الإنجليزية', () => {
  it('يترجم «Nasr City» إلى مدينة نصر/القاهرة والمفتاح الرسمي', () => {
    const resolved = resolveListingLocation('Nasr City', 'Cairo');
    expect(resolved.matched).toBe(true);
    expect(resolved.city).toBe('مدينة نصر');
    expect(resolved.governorate).toBe('القاهرة');
    expect(resolved.neighborhoodId).toBe('مدينهنصر');
  });

  it('يترجم «Sheikh Zayed» من جيزة الإنجليزي', () => {
    const resolved = resolveListingLocation('Sheikh Zayed', 'Giza');
    expect(resolved.matched).toBe(true);
    expect(resolved.city).toBe('الشيخ زايد');
    expect(resolved.governorate).toBe('الجيزة');
  });

  it('الاسم العربي المطابق إنجليزي المحافظة يُصحّح المحافظة', () => {
    const resolved = resolveListingLocation('المعادي', 'Cairo');
    expect(resolved.matched).toBe(true);
    expect(resolved.governorate).toBe('القاهرة');
    expect(resolved.neighborhoodId).toBe('المعادي');
  });

  it('حرف كبير/مسافات لا يكسر الترجمات (حالة غير حساسة)', () => {
    const resolved = resolveListingLocation('  Maadi ', '  Cairo ');
    expect(resolved.matched).toBe(true);
    expect(resolved.city).toBe('المعادي');
  });

  it('اسم إنجليزي غير معروف يُحفظ كأفضل جهد مع محافظة مترجمة', () => {
    const resolved = resolveListingLocation('Some Compound', 'Dakahlia');
    expect(resolved.matched).toBe(false);
    expect(resolved.city).toBe('Some Compound');
    expect(resolved.governorate).toBe('الدقهلية');
  });
});

describe('resolveEnPlace', () => {
  it('يعيد null عند غياب المطابقة', () => {
    expect(resolveEnPlace('Anything Else')).toBeNull();
  });
});

describe('resolvePlaceFromSearchUrl', () => {
  const base = '/en/properties/apartments-duplex-for-rent/';
  it('يستخرج حيًّا من slug صفحة بحروف صغيرة', () => {
    expect(resolvePlaceFromSearchUrl(`https://www.dubizzle.com.eg${base}5th-settlement/?sorting=asc-price`)).toEqual({
      city: 'التجمع الخامس',
      governorate: 'القاهرة',
    });
  });
  it('يطابق slug بشرطات مع alias بمسافات (hadayek october)', () => {
    expect(resolvePlaceFromSearchUrl(`https://www.dubizzle.com.eg${base}hadayek-october/q-x/?sorting=x`)).toEqual({
      city: 'حدائق أكتوبر',
      governorate: 'الجيزة',
    });
  });
  it('يعيد null لصفحة حي غير معروف', () => {
    expect(resolvePlaceFromSearchUrl(`https://www.dubizzle.com.eg${base}zzz-unknown/q-x/`)).toBeNull();
  });
  it('يعيد null لعنوان مالstatic لمسار غير مطابق', () => {
    expect(resolvePlaceFromSearchUrl('https://www.dubizzle.com.eg/en/properties/zoo')).toBeNull();
  });
});

describe('listingDedupKey', () => {
  const base = {
    neighborhoodId: 'القاهرهالجديده',
    propertyType: 'duplex',
    bedrooms: 3,
    areaM2: 236,
    price: 90000,
  };

  it('يحسب مفتاحًا واحدًا لإعلانات متطابقة الشقة/السعر', () => {
    expect(listingDedupKey(base)).toBe(listingDedupKey({ ...base }));
  });

  it('يحسب نفس المفتاح لمساحات تختلف بأقل من 10م² (نفس الشقة)', () => {
    expect(listingDedupKey(base)).toBe(listingDedupKey({ ...base, areaM2: 240 }));
  });

  it('يميّز مفتاحين عند اختلاف السعر (إعلانان حقيقيان)', () => {
    expect(listingDedupKey(base)).not.toBe(listingDedupKey({ ...base, price: 91000 }));
  });

  it('يميّز مفتاحين عند اختلاف الحي', () => {
    expect(listingDedupKey(base)).not.toBe(
      listingDedupKey({ ...base, neighborhoodId: 'مدينهنصر' })
    );
  });

  it('يعيد null عندما يكون النوع أو السعر مفقودًا', () => {
    expect(listingDedupKey({ ...base, propertyType: null })).toBeNull();
    expect(listingDedupKey({ ...base, price: null })).toBeNull();
  });
});
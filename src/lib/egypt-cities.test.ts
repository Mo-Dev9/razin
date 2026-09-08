import { describe, it, expect } from 'vitest';
import {
  EGYPT_CITIES,
  EGYPT_GOVERNORATES,
  findCityCenter,
  matchCityName,
  governorateOf,
  placesOf,
  isPlaceIn,
  matchLocation,
  matchesCityFilter,
  normalizeSearchText,
} from './egypt-cities';

describe('EGYPT_CITIES', () => {
  it('exposes exactly 27 governorates', () => {
    expect(EGYPT_CITIES.length).toBe(27);
  });

  it('has unique names', () => {
    const names = EGYPT_CITIES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('findCityCenter', () => {
  it('returns the center for a known governorate', () => {
    const center = findCityCenter('الجيزة');
    expect(center).not.toBeNull();
    expect(center?.lat).toBeCloseTo(30.0131, 3);
    expect(center?.lng).toBeCloseTo(31.2089, 3);
  });

  it('handles "محافظة" prefix and alef/taa marbuta variants', () => {
    expect(findCityCenter('محافظة الدقهلية')).not.toBeNull();
    expect(findCityCenter('الإسكندرية')).not.toBeNull();
  });

  it('returns null for unknown names', () => {
    expect(findCityCenter('مدينة غير موجودة')).toBeNull();
  });
});

describe('matchCityName', () => {
  it('matches the governorate from candidate address parts', () => {
    const parts = ['الحي التاسع', 'السادس من أكتوبر', 'الجيزة'];
    expect(matchCityName(parts)).toBe('الجيزة');
  });

  it('prefers the part that matches first in order', () => {
    expect(matchCityName(['المنصورة', 'الدقهلية'])).toBe('الدقهلية');
  });

  it('returns null when nothing matches', () => {
    expect(matchCityName(['6 أكتوبر'])).toBeNull();
    expect(matchCityName([])).toBeNull();
  });
});

describe('EGYPT_GOVERNORATES', () => {
  it('exposes exactly 27 governorates', () => {
    expect(EGYPT_GOVERNORATES.length).toBe(27);
  });

  it('has unique governorate names and unique places per governorate', () => {
    const names = EGYPT_GOVERNORATES.map((g) => g.name);
    expect(new Set(names).size).toBe(names.length);
    for (const gov of EGYPT_GOVERNORATES) {
      expect(gov.places.length).toBeGreaterThan(0);
      expect(gov.center.lat).toBeGreaterThan(0);
      expect(gov.center.lng).toBeGreaterThan(0);
      const placeNames = gov.places.map((p) => p.name);
      expect(new Set(placeNames).size).toBe(placeNames.length);
    }
  });

  it('includes the main city worldwide (Cairo districts & Alexandria neighborhoods)', () => {
    expect(placesOf('القاهرة').some((p) => p.name === 'مدينة نصر')).toBe(true);
    expect(placesOf('القاهرة').some((p) => p.name === 'المعادي')).toBe(true);
    expect(placesOf('الإسكندرية').some((p) => p.name === 'المنتزه')).toBe(true);
    expect(placesOf('الإسكندرية').some((p) => p.name === 'أبو قير')).toBe(true);
  });
});

describe('governorateOf', () => {
  it('resolves a city/neighborhood name to its governorate', () => {
    expect(governorateOf('مدينة نصر')?.name).toBe('القاهرة');
    expect(governorateOf('طنطا')?.name).toBe('الغربية');
  });

  it('resolves a legacy stored governorate name', () => {
    expect(governorateOf('الجيزة')?.name).toBe('الجيزة');
    expect(governorateOf('الدقهلية')?.name).toBe('الدقهلية');
  });

  it('returns null for unknown names', () => {
    expect(governorateOf('مجهولة')).toBeNull();
  });
});

describe('isPlaceIn', () => {
  it('checks membership within a governorate', () => {
    expect(isPlaceIn('6 أكتوبر', 'الجيزة')).toBe(true);
    expect(isPlaceIn('دمياط', 'الجيزة')).toBe(false);
  });
});

describe('matchLocation', () => {
  it('resolves a city-level match first', () => {
    const res = matchLocation(['الحي التاسع', '6 أكتوبر', 'الجيزة']);
    expect(res.governorate).toBe('الجيزة');
    expect(res.city).toBe('6 أكتوبر');
  });

  it('falls back to governorate-only match', () => {
    const res = matchLocation(['الدقهلية']);
    expect(res.governorate).toBe('الدقهلية');
    expect(res.city).toBeNull();
  });

  it('returns nulls when nothing matches', () => {
    expect(matchLocation(['مدينة صحراوية'])).toEqual({ governorate: null, city: null });
    expect(matchLocation([])).toEqual({ governorate: null, city: null });
  });
});

describe('matchesCityFilter', () => {
  it('matches new-style city values under a governorate filter', () => {
    expect(matchesCityFilter('طنطا', 'الغربية')).toBe(true);
    expect(matchesCityFilter('مدينة نصر', 'القاهرة')).toBe(true);
  });

  it('keeps legacy governorate-stored names matching their governorate filter only', () => {
    expect(matchesCityFilter('الغربية', 'الغربية')).toBe(true);
    expect(matchesCityFilter('القاهرة', 'القاهرة')).toBe(true);
    // لكن لا تظهر تحت فلتر مدينة/حي محدد (بلا governorate مخزن)
    expect(matchesCityFilter('القاهرة', 'مدينة نصر')).toBe(false);
    expect(matchesCityFilter('الجيزة', '6 أكتوبر')).toBe(false);
  });

  it('matches an exact city filter', () => {
    expect(matchesCityFilter('طنطا', 'طنطا')).toBe(true);
  });

  it('rejects unrelated values', () => {
    expect(matchesCityFilter('القاهرة', 'الغربية')).toBe(false);
    expect(matchesCityFilter('طنطا', 'الإسكندرية')).toBe(false);
  });

  it('disambiguates duplicate neighborhood names with the stored governorate', () => {
    // «دار السلام» في القاهرة وفي سوهاج: بدون محافظة صريحة يُمرَّران معًا،
    // وبمحافظة صريحة يُقيَّدان بمحافظة الفلتر فقط.
    expect(matchesCityFilter('دار السلام', 'القاهرة')).toBe(true);
    expect(matchesCityFilter('دار السلام', 'سوهاج')).toBe(true);
    expect(matchesCityFilter('دار السلام', 'القاهرة', 'القاهرة')).toBe(true);
    expect(matchesCityFilter('دار السلام', 'القاهرة', 'سوهاج')).toBe(false);
    expect(matchesCityFilter('دار السلام', 'سوهاج', 'سوهاج')).toBe(true);
    expect(matchesCityFilter('دار السلام', 'سوهاج', 'القاهرة')).toBe(false);
  });

  it('matches the stored governorate directly', () => {
    expect(matchesCityFilter('أي شيء', 'القاهرة', 'القاهرة')).toBe(true);
    expect(matchesCityFilter('أي شيء', 'القاهرة', 'الغربية')).toBe(false);
  });

  it('scopes a district filter to that district only — not every building in the governorate', () => {
    // مبانٍ في الجيزة بمدن مختلفة: فلتر «6 أكتوبر» يمرر 6 أكتوبر فقط
    expect(matchesCityFilter('6 أكتوبر', '6 أكتوبر', 'الجيزة')).toBe(true);
    expect(matchesCityFilter('فيصل', '6 أكتوبر', 'الجيزة')).toBe(false);
    expect(matchesCityFilter('الهرم', '6 أكتوبر', 'الجيزة')).toBe(false);
    // حتى مبنى قديم مخزّن باسم المحافظة لا يظهر تحت فلتر مدينة محدد
    expect(matchesCityFilter('الجيزة', '6 أكتوبر')).toBe(false);
    // والمباني بلا محافظة مخزنة تطابق مدينتها الحرفية فقط
    expect(matchesCityFilter('فيصل', 'فيصل')).toBe(true);
  });
});

describe('normalizeSearchText', () => {
  it('unifies hamza, taa marbuta and alef maqsura for matching', () => {
    expect(normalizeSearchText('اكتوبر')).toBe(normalizeSearchText('أكتوبر'));
    expect(normalizeSearchText('مدينة')).toBe(normalizeSearchText('مدينه'));
    expect(normalizeSearchText('مدى')).toBe('مدي');
  });

  it('keeps digits and words (6 أكتوبر) intact', () => {
    expect(normalizeSearchText('6 أكتوبر')).toBe('6 اكتوبر');
    expect(normalizeSearchText('شارع مصطفى النحاس')).toContain('مصطفي');
  });

  it('strips diacritics (tashkeel) so "مُدينة" matches "مدينة"', () => {
    expect(normalizeSearchText('مُدينة')).toBe(normalizeSearchText('مدينة'));
    expect(normalizeSearchText('6 أبريل')).toBe('6 ابريل');
  });

  it('collapses whitespace and trims', () => {
    expect(normalizeSearchText('  مدينة   نصر  ')).toBe('مدينه نصر');
  });
});

describe('matchesCityFilter — حواف', () => {
  it('returns false for empty values', () => {
    expect(matchesCityFilter('', 'القاهرة')).toBe(false);
    expect(matchesCityFilter('مدينة نصر', '')).toBe(false);
    expect(matchesCityFilter('', '')).toBe(false);
  });

  it('fallback: filter outside known data matches the raw name only', () => {
    expect(matchesCityFilter('هرم', 'هرم')).toBe(true);
    expect(matchesCityFilter('فيصل', 'غير معروفة')).toBe(false);
  });

  it('same governorate, different district → false', () => {
    expect(matchesCityFilter('إمبابة', 'فيصل', 'الجيزة')).toBe(false);
    expect(matchesCityFilter('الزمالك', 'مدينة نصر', 'القاهرة')).toBe(false);
  });
});

describe('governorateOf — تعرّف الحواف', () => {
  it('returns the first governorate owning an ambiguous name', () => {
    expect(governorateOf('دار السلام')?.name).toBe('القاهرة');
  });

  it('requires an exact governorate name for isPlaceIn membership', () => {
    expect(isPlaceIn('فيصل', 'الجيزة')).toBe(true);
    expect(isPlaceIn('فيصل', 'محافظة الجيزة')).toBe(false);
  });

  it('placesOf returns [] for an unknown governorate', () => {
    expect(placesOf('مجهولة')).toEqual([]);
  });

  it('governorateOf returns null for empty/unknown', () => {
    expect(governorateOf('')).toBeNull();
    expect(governorateOf('نص عشوائي')).toBeNull();
  });
});

describe('matchLocation — ترتيب المطابقة', () => {
  it('resolves the first matching part in order — governorate name matches its own place entry', () => {
    // «الجيزة» يطابق place الجيزة نفسه (المدينة المركزية) وينتهي عنده
    expect(matchLocation(['الجيزة', '6 أكتوبر'])).toEqual({ governorate: 'الجيزة', city: 'الجيزة' });
  });

  it('resolves a city even when it appears late and governorate appears earlier', () => {
    // عكس الحالة: أول مطابقة تفوز — «6 أكتوبر» مكانٌ فرع محافظة الجيزة
    expect(matchLocation(['6 أكتوبر', 'الجيزة']).governorate).toBe('الجيزة');
  });

  it('normalizes whitespace and Arabic variants in parts', () => {
    expect(matchLocation(['مدينة  6  أكتوبر', '  ']).city).toBe('6 أكتوبر');
  });
});
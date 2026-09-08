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

  it('matches legacy stored governorate names under their governorate', () => {
    expect(matchesCityFilter('الغربية', 'الغربية')).toBe(true);
    expect(matchesCityFilter('القاهرة', 'مدينة نصر')).toBe(true);
  });

  it('matches an exact city filter', () => {
    expect(matchesCityFilter('طنطا', 'طنطا')).toBe(true);
  });

  it('rejects unrelated values', () => {
    expect(matchesCityFilter('القاهرة', 'الغربية')).toBe(false);
    expect(matchesCityFilter('طنطا', 'الإسكندرية')).toBe(false);
  });
});
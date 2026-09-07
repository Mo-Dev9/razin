import { describe, it, expect } from 'vitest';
import { EGYPT_CITIES, findCityCenter, matchCityName } from './egypt-cities';

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
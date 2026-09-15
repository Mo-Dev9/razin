import { describe, it, expect } from 'vitest';
import { isValidNeighborhoodId } from './neighborhood-ids';

describe('isValidNeighborhoodId', () => {
  it('يقبل المعرّفات العربية والأرقام والشرطات', () => {
    expect(isValidNeighborhoodId('مدينهنصر')).toBe(true);
    expect(isValidNeighborhoodId('6اكتوبر')).toBe(true);
    expect(isValidNeighborhoodId('دارالسلام-القاهره')).toBe(true);
  });

  it('يرفض المسارات المركبة مثل a/b (بعد فك الترميز)', () => {
    expect(isValidNeighborhoodId('a/b')).toBe(false);
  });

  it('يرفض الخلفات المائلة والمسافات الفارغة والنصوص الطويلة', () => {
    expect(isValidNeighborhoodId('a\\b')).toBe(false);
    expect(isValidNeighborhoodId('')).toBe(false);
    expect(isValidNeighborhoodId('x'.repeat(101))).toBe(false);
  });

  it('يرفض محارف التحكم', () => {
    expect(isValidNeighborhoodId('a\nb')).toBe(false);
    expect(isValidNeighborhoodId('a\tb')).toBe(false);
  });
});
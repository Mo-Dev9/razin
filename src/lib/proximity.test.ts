import { describe, it, expect } from 'vitest';
import { haversineKm, isNearKm, nearestPlaceName, NEAR_KM } from '@/lib/proximity';

describe('haversineKm', () => {
  it('يعطي صفرًا للنطرة نفسها', () => {
    expect(haversineKm(30.0444, 31.2357, 30.0444, 31.2357)).toBe(0);
  });

  it('المسافة بين القاهرة والإسكندرية ~ 180 كم', () => {
    const d = haversineKm(30.0444, 31.2357, 31.2001, 29.9187);
    expect(d).toBeGreaterThan(170);
    expect(d).toBeLessThan(190);
  });
});

describe('isNearKm', () => {
  it('عرضي في القاهرة الجديدة قريب من وسطها (تحت 5 كم)', () => {
    const cam = 30.0033; // التجمع الخامس تقريبًا
    const cng = 31.506;
    expect(isNearKm(cam, cng, 30.03, 31.48)).toBe(true);
  });

  it('القاهرة الجديدة بعيدة عن المنصورة', () => {
    const cairo = [30.0033, 31.506] as const;
    const mansoura = [31.036, 31.38] as const;
    expect(isNearKm(cairo[0], cairo[1], mansoura[0], mansoura[1])).toBe(false);
    expect(haversineKm(cairo[0], cairo[1], mansoura[0], mansoura[1])).toBeGreaterThan(NEAR_KM);
  });
});

describe('nearestPlaceName', () => {
  it('يعرف وسط القاهرة', () => {
    expect(nearestPlaceName(30.0444, 31.2357)).not.toBeNull();
  });

  it('يعيد null لإحداثيات خارج مصر (بدون موضوع)', () => {
    expect(nearestPlaceName(48.8566, 2.3522)).toBeNull(); // باريس
  });
});
import { describe, it, expect } from 'vitest';
import { isValidPostId } from './post-ids';

describe('isValidPostId', () => {
  it('يقبل معرّفات Firestore العشوائية النموذجية', () => {
    expect(isValidPostId('AbCdEf1234567890')).toBe(true);
    expect(isValidPostId('x'.repeat(200))).toBe(true);
  });

  it('يرفض المسارات المركبة مثل a/b', () => {
    expect(isValidPostId('a/b')).toBe(false);
  });

  it('يرفض الخلفات المائلة والمسافات الفارغة والمفرطة الطول', () => {
    expect(isValidPostId('a\\b')).toBe(false);
    expect(isValidPostId('')).toBe(false);
    expect(isValidPostId('x'.repeat(201))).toBe(false);
  });

  it('يرفض محارف التحكم', () => {
    expect(isValidPostId('a\nb')).toBe(false);
    expect(isValidPostId('a\tb')).toBe(false);
  });
});
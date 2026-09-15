import { describe, it, expect } from 'vitest';
import { isMonthlyListing } from '@/lib/neighborhood-writer';

describe('isMonthlyListing', () => {
  it('يقبل null (بلا تردد = شهري افتراضيًا)', () => {
    expect(isMonthlyListing({ rentalFrequency: null })).toBe(true);
    expect(isMonthlyListing({})).toBe(true);
  });

  it('يقبل شهري تحديدًا', () => {
    expect(isMonthlyListing({ rentalFrequency: 'monthly' })).toBe(true);
  });

  it('يرفض يومي/أسبوعي/سنوي', () => {
    expect(isMonthlyListing({ rentalFrequency: 'daily' })).toBe(false);
    expect(isMonthlyListing({ rentalFrequency: 'weekly' })).toBe(false);
    expect(isMonthlyListing({ rentalFrequency: 'yearly' })).toBe(false);
  });
});
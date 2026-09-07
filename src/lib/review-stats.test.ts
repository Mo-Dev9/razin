import { describe, it, expect } from 'vitest';
import { computeAverages } from '@/lib/review-stats';

const KEYS = [
  'zahma', 'humidity', 'landlord', 'neighbors', 'cleanliness',
  'safety', 'services', 'annoyance', 'elevator', 'maintenance', 'ac', 'condition',
] as const;

describe('computeAverages', () => {
  it('returns empty ratings for no reviews', () => {
    const { averageRatings, reviewCount } = computeAverages([]);
    expect(reviewCount).toBe(0);
    expect(averageRatings.overall).toBe(0);
    // No rated key → no key is present (not zeroed).
    for (const k of KEYS) expect(averageRatings[k]).toBeUndefined();
  });

  it('averages a single complete review', () => {
    const ratings: Record<string, number> = {};
    for (const k of KEYS) ratings[k] = 4;
    const { averageRatings, reviewCount } = computeAverages([
      { ratings, overall: 4 },
    ]);
    expect(reviewCount).toBe(1);
    for (const k of KEYS) expect(averageRatings[k]).toBe(4);
    expect(averageRatings.overall).toBe(4);
  });

  it('averages across multiple reviews', () => {
    const ratings = { zahma: 2, humidity: 4, landlord: 6, neighbors: 8 };
    const { averageRatings, reviewCount } = computeAverages([
      { ratings, overall: 5 },
      { ratings: { ...ratings }, overall: 3 },
    ]);
    expect(reviewCount).toBe(2);
    expect(averageRatings.zahma).toBe(2);
    expect(averageRatings.humidity).toBe(4);
    expect(averageRatings.overall).toBe(4);
  });

  it('ignores a missing rating key instead of counting it as 0', () => {
    const { averageRatings } = computeAverages([
      { ratings: { zahma: 2 }, overall: 2 },
      { ratings: {}, overall: 2 },
    ]);
    expect(averageRatings.zahma).toBe(2); // rated in 1 of 2 reviews
    expect(averageRatings.humidity).toBeUndefined();
  });

  it('ignores non-number rating values', () => {
    const { averageRatings } = computeAverages([
      { ratings: { zahma: 2, humidity: 'bad' as unknown as number, safety: null as unknown as number }, overall: 2 },
    ]);
    expect(averageRatings.zahma).toBe(2);
    expect(averageRatings.humidity).toBeUndefined();
    expect(averageRatings.safety).toBeUndefined();
  });

  it('still computes overall when per-key data is missing', () => {
    const { averageRatings } = computeAverages([
      { ratings: {}, overall: 4 },
      { ratings: {} },
    ]);
    expect(averageRatings.overall).toBe(2);
  });

  it('omits condition for legacy reviews that predate it', () => {
    const { averageRatings } = computeAverages([
      { ratings: { zahma: 3, humidity: 2 }, overall: 3 },
      { ratings: { zahma: 5, humidity: 4 }, overall: 4 },
    ]);
    expect(averageRatings.zahma).toBe(4);
    expect(averageRatings.condition).toBeUndefined();
  });
});
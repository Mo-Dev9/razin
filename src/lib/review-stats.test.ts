import { describe, it, expect } from 'vitest';
import { computeAverages } from '@/lib/review-stats';

const KEYS = [
  'zahma', 'humidity', 'landlord', 'neighbors', 'cleanliness',
  'safety', 'services', 'annoyance', 'elevator', 'maintenance', 'ac', 'condition',
] as const;

describe('computeAverages', () => {
  it('returns zeros for no reviews', () => {
    const { averageRatings, reviewCount } = computeAverages([]);
    expect(reviewCount).toBe(0);
    for (const k of KEYS) expect(averageRatings[k]).toBe(0);
    expect(averageRatings.overall).toBe(0);
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

  it('treats a missing rating key as 0 contribution', () => {
    const { averageRatings } = computeAverages([
      { ratings: { zahma: 2 }, overall: 2 },
      { ratings: {}, overall: 2 },
    ]);
    expect(averageRatings.zahma).toBe(1); // (2 + 0) / 2
  });

  it('ignores non-number rating values', () => {
    const { averageRatings } = computeAverages([
      { ratings: { zahma: 2, humidity: 'bad' as unknown as number, safety: null as unknown as number }, overall: 2 },
    ]);
    expect(averageRatings.zahma).toBe(2);
    expect(averageRatings.humidity).toBe(0);
    expect(averageRatings.safety).toBe(0);
  });

  it('contributes 0 to overall when missing', () => {
    const { averageRatings } = computeAverages([
      { ratings: {}, overall: 4 },
      { ratings: {} },
    ]);
    expect(averageRatings.overall).toBe(2);
  });
});
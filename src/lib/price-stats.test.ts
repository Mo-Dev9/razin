import { describe, it, expect } from 'vitest';
import {
  computePriceStats,
  dataSufficient,
  MIN_DISPLAY_SOURCES,
} from '@/lib/price-stats';

describe('computePriceStats', () => {
  it('returns nulls for no listings', () => {
    const s = computePriceStats([]);
    expect(s).toEqual({ count: 0, min: null, max: null, median: null, p25: null, p75: null });
  });

  it('handles a single listing', () => {
    const s = computePriceStats([{ price: 12000 }]);
    expect(s.count).toBe(1);
    expect(s.min).toBe(12000);
    expect(s.max).toBe(12000);
    expect(s.median).toBe(12000);
    expect(s.p25).toBe(12000);
    expect(s.p75).toBe(12000);
  });

  it('computes median for odd count (the exact middle price)', () => {
    const s = computePriceStats([{ price: 10000 }, { price: 15000 }, { price: 12000 }]);
    expect(s.median).toBe(12000);
    expect(s.min).toBe(10000);
    expect(s.max).toBe(15000);
  });

  it('computes median for even count (average of the two middles)', () => {
    const s = computePriceStats([
      { price: 10000 }, { price: 12000 }, { price: 13000 }, { price: 20000 },
    ]);
    expect(s.median).toBe(12500);
  });

  it('stays stable when a single runaway ad is added', () => {
    const base = [
      { price: 10000 }, { price: 11000 }, { price: 12000 },
      { price: 12500 }, { price: 13000 },
    ];
    const without = computePriceStats(base);
    const withOutlier = computePriceStats([...base, { price: 990000 }]);
    // الوسيط يتأثر تأثرًا طفيفًا فقط بشاذ واحد (12250 بدل 12000)، بينما المعدل
    // الحسابي كان سينفجر إلى ~176 ألف. الإعلان الشاذ لا يحرك النتيجة.
    expect(withOutlier.median).toBe(12250);
    expect(withOutlier.median).toBeLessThanOrEqual(without.median! + 250);
  });

  it('ignores invalid or zero prices', () => {
    const s = computePriceStats([
      { price: 10000 },
      { price: 0 },
      { price: -5 },
      { price: Number.NaN },
    ]);
    expect(s.count).toBe(1);
    expect(s.median).toBe(10000);
  });

  it('orders p25 <= median <= p75', () => {
    const prices = [
      9000, 9500, 10000, 10500, 11000, 11200, 11500, 11800,
      12000, 12300, 12600, 13000, 13500, 14000, 14500, 15000,
    ];
    const s = computePriceStats(prices.map((price) => ({ price })));
    expect(s.p25!).toBeLessThanOrEqual(s.median!);
    expect(s.median!).toBeLessThanOrEqual(s.p75!);
    expect(s.count).toBe(16);
  });

  it('computes known linear-interpolated percentiles (R-7 style)', () => {
    const prices = [100, 110, 120, 130, 140];
    const s = computePriceStats(prices.map((price) => ({ price })));
    expect(s.min).toBe(100);
    expect(s.max).toBe(140);
    expect(s.median).toBe(120);
    expect(s.p25).toBeCloseTo(110, 10); // (4)*0.25=1 → 110
    expect(s.p75).toBeCloseTo(130, 10); // (4)*0.75=3 → 130
  });
});

describe('dataSufficient', () => {
  it('respects MIN_DISPLAY_SOURCES', () => {
    expect(dataSufficient(MIN_DISPLAY_SOURCES)).toBe(true);
    expect(dataSufficient(MIN_DISPLAY_SOURCES - 1)).toBe(false);
    expect(dataSufficient(0)).toBe(false);
  });
});
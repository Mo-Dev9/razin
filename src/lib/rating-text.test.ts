import { describe, it, expect } from 'vitest';
import { ratingSummaryText, ratingScaleText } from './rating-text';

describe('ratingSummaryText', () => {
  it('handles zero reviews', () => {
    expect(ratingSummaryText(0)).toBe('لا تقييمات');
  });

  it('handles singular', () => {
    expect(ratingSummaryText(1)).toBe('تقييم واحد');
  });

  it('handles dual', () => {
    expect(ratingSummaryText(2)).toBe('تقييمان');
  });

  it('handles 3–10', () => {
    expect(ratingSummaryText(3)).toBe('3 تقييمات');
    expect(ratingSummaryText(10)).toBe('10 تقييمات');
  });

  it('handles 11+ with tanween accusative', () => {
    expect(ratingSummaryText(12)).toBe('12 تقييمًا');
    expect(ratingSummaryText(120)).toBe('120 تقييمًا');
  });
});

describe('ratingScaleText', () => {
  it('formats the overall on a 5 scale', () => {
    expect(ratingScaleText(4.3)).toBe('4.3 من 5');
    expect(ratingScaleText(5)).toBe('5.0 من 5');
  });
});
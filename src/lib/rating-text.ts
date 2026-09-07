export function ratingSummaryText(reviewCount: number): string {
  if (reviewCount <= 0) return 'لا تقييمات';
  if (reviewCount === 1) return 'تقييم واحد';
  if (reviewCount === 2) return 'تقييمان';
  if (reviewCount <= 10) return `${reviewCount} تقييمات`;
  return `${reviewCount} تقييمًا`;
}

export function ratingScaleText(overall: number): string {
  return `${overall.toFixed(1)} من 5`;
}
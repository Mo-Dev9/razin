export function generateAnonymousName(uid: string): string {
  const suffix = uid.slice(0, 4).toLowerCase();
  return `مستخدم_${suffix}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ratingToLabel(rating: number): string {
  if (rating >= 4.5) return 'ممتاز';
  if (rating >= 3.5) return 'جيد جداً';
  if (rating >= 2.5) return 'جيد';
  if (rating >= 1.5) return 'مقبول';
  return 'ضعيف';
}

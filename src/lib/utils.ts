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
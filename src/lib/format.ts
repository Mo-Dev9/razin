import { FINISHING_LEVELS, PROPERTY_TYPES } from '@/types';

const FINISHING_AR: Record<string, string> = Object.fromEntries(
  FINISHING_LEVELS.map((f) => [f.id, f.ar])
);
const PROPERTY_AR: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map((p) => [p.id, p.ar])
);

export function formatEGP(price: number): string {
  return `${price.toLocaleString('ar-EG')} ج.م`;
}

export const AR_AD_FORMS = { one: 'إعلان واحد', two: 'إعلانان', few: 'إعلانات', many: 'إعلانًا' };
export const AR_POST_FORMS = { one: 'مشاركة واحدة', two: 'مشاركتان', few: 'مشاركات', many: 'مشاركةً' };
export const AR_COMMENT_FORMS = { one: 'تعليق واحد', two: 'تعليقان', few: 'تعليقات', many: 'تعليقًا' };

export function arCount(
  n: number,
  forms: { one: string; two: string; few: string; many: string }
): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  if (n >= 3 && n <= 10) return `${n} ${forms.few}`;
  return `${n} ${forms.many}`;
}

export function propertyLabel(id?: string | null): string {
  return (id && PROPERTY_AR[id]) || '—';
}

export function finishingLabel(id?: string | null): string {
  return (id && FINISHING_AR[id]) || '—';
}

export function roomsLabel(rooms?: number | null): string {
  if (rooms == null || rooms <= 0) return 'استوديو';
  return arCount(rooms, { one: 'غرفة واحدة', two: 'غرفتان', few: 'غرف', many: 'غرفة' });
}

export function formatDateAr(ts: number): string {
  if (!Number.isFinite(ts) || ts <= 0) return '—';
  return new Date(ts).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}
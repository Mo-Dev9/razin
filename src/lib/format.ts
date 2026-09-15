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

export function propertyLabel(id?: string | null): string {
  return (id && PROPERTY_AR[id]) || '—';
}

export function finishingLabel(id?: string | null): string {
  return (id && FINISHING_AR[id]) || '—';
}

export function roomsLabel(rooms?: number | null): string {
  return rooms == null || rooms <= 0 ? 'استوديو' : `${rooms} غرف`;
}

export function formatDateAr(ts: number): string {
  if (!Number.isFinite(ts) || ts <= 0) return '—';
  return new Date(ts).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}
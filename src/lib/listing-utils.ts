import { normalizeSearchText } from '@/lib/egypt-cities';

/**
 * مفتاح الحي الموحّد المخزّن في listings/questions — يوحّد الهمزات والتاء المربوطة
 * والألف المقصورة حتى تتجمع السجلات نفسها (جزء من اختبار سلوكي نصي §5.3).
 */
export function neighborhoodKey(city: string): string {
  return normalizeSearchText(city);
}
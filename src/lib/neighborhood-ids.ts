/**
 * مدقّق معرّف الحي المستخدم في حدود الوصول قبل أي استعلام Firestore.
 * الغرض الأمني: منع تشكيل مسارات مستندات مركّبة مثل `a/b` (تُرمى من Firestore
 * بـ 500 عند المرور دون فحص). الرفض الفعلي: `/` و`\` وطول >100 ومحارف التحكم—أي
 * معرّف غير مرفوض يمرر كما هو (لا حظرُ مجموعات محددة من الرموز).
 */
export function isValidNeighborhoodId(neighborhoodId: string): boolean {
  if (!neighborhoodId || neighborhoodId.length > 100) return false;
  if (neighborhoodId.includes('/') || neighborhoodId.includes('\\')) return false;
  // محارف تحكم (سطور/تبويب...) لا تدخل أي معرّف صالح
  return !/[\u0000-\u001F\u007F]/.test(neighborhoodId);
}
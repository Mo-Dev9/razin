/**
 * مدقّق معرّف منشور الحارة — يُطبَّق قبل أي `collection('posts').doc(id)`.
 * يمنع تشكيل مسارات مركّبة (`a/b`) التي تُرمى من Firestore بـ 500، تمامًا
 * كـ isValidNeighborhoodId. معرّفات المنشورات عشوائية من Firestore (A-Za-z0-9)
 * فكل ما عدا ذلك مرفوض.
 */
export function isValidPostId(postId: string): boolean {
  if (!postId || postId.length > 200) return false;
  if (postId.includes('/') || postId.includes('\\')) return false;
  // محارف تحكم لا تدخل أي معرّف صالح
  return !/[\u0000-\u001F\u007F]/.test(postId);
}
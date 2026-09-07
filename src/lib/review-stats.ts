import { getAdminDb } from '@/lib/firebase-admin';

const RATING_KEYS = [
  'zahma', 'humidity', 'landlord', 'neighbors', 'cleanliness',
  'safety', 'services', 'annoyance', 'elevator', 'maintenance', 'ac', 'condition',
] as const;

export function computeAverages(
  reviews: { ratings?: Record<string, number>; overall?: number }[]
): { averageRatings: Record<string, number>; reviewCount: number } {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const k of RATING_KEYS) {
    sums[k] = 0;
    counts[k] = 0;
  }
  let overall = 0;

  for (const review of reviews) {
    for (const k of RATING_KEYS) {
      const v = review.ratings?.[k];
      if (typeof v === 'number') {
        sums[k] += v;
        counts[k]++;
      }
    }
    overall += review.overall || 0;
  }

  const n = reviews.length;
  const averageRatings: Record<string, number> = {};
  // Per-key denominators: a key is omitted (not zeroed) when no review rated
  // it, so legacy reviews written before a key existed don't drag it to 0.
  for (const k of RATING_KEYS) {
    if (counts[k] > 0) averageRatings[k] = sums[k] / counts[k];
  }
  averageRatings.overall = n > 0 ? overall / n : 0;

  return { averageRatings, reviewCount: n };
}

/**
 * Recomputes a building's aggregate ratings by reading all its reviews
 * from scratch. Guarantees correctness over the cheaper incremental math,
 * which accumulates float drift. Call inside a write path only.
 */
export async function recomputeBuildingStats(buildingId: string): Promise<void> {
  const db = getAdminDb();
  const reviews = await db
    .collection('reviews')
    .where('buildingId', '==', buildingId)
    .get();

  const docs = reviews.docs.map((d) => d.data());
  const { averageRatings, reviewCount } = computeAverages(docs);

  const latest = docs.reduce<number>(
    (max, r) => Math.max(max, r.createdAt || 0),
    0
  );

  await db.collection('buildings').doc(buildingId).update({
    averageRatings,
    reviewCount,
    ...(latest > 0 ? { lastReviewAt: latest } : { lastReviewAt: 0 }),
  });
}

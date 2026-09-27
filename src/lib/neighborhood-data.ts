import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { isValidNeighborhoodId } from '@/lib/neighborhood-ids';
import type { Listing } from '@/types';

/**
 * مستند الحي في Firestore neighborhoods/{id} — ملخص إحصاءات مخزّن O(1)
 * وiquiry listings/ questions في الخلفية (§5.3).
 */

export interface NeighborhoodMetaDoc {
  neighborhoodId: string;
  city: string | null;
  governorate: string | null;
  count: number;
  min: number | null;
  max: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
  ready: boolean;
  lastUpdated: number;
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function readMeta(id: string, raw: Record<string, unknown>): NeighborhoodMetaDoc {
  return {
    neighborhoodId: id,
    city: typeof raw.city === 'string' ? raw.city : null,
    governorate: typeof raw.governorate === 'string' ? raw.governorate : null,
    count: Number(raw.count) || 0,
    min: numOrNull(raw.min),
    max: numOrNull(raw.max),
    median: numOrNull(raw.median),
    p25: numOrNull(raw.p25),
    p75: numOrNull(raw.p75),
    ready: Boolean(raw.ready),
    lastUpdated: Number(raw.lastUpdated) || 0,
  };
}

export async function getNeighborhoodsMeta(
  db: Firestore = getAdminDb()
): Promise<NeighborhoodMetaDoc[]> {
  const snap = await db.collection('neighborhoods').get();
  return snap.docs.map((d) => readMeta(d.id, d.data() as Record<string, unknown>));
}

export async function getReadyNeighborhoods(
  db: Firestore = getAdminDb()
): Promise<NeighborhoodMetaDoc[]> {
  const all = await getNeighborhoodsMeta(db);
  return all
    .filter((m) => m.ready)
    .sort((a, b) => b.count - a.count);
}

export async function getNeighborhoodMeta(
  neighborhoodId: string,
  db: Firestore = getAdminDb()
): Promise<NeighborhoodMetaDoc | null> {
  if (!isValidNeighborhoodId(neighborhoodId)) return null;
  const doc = await db.collection('neighborhoods').doc(neighborhoodId).get();
  if (!doc.exists) return null;
  return readMeta(doc.id, doc.data() as Record<string, unknown>);
}

export async function getNeighborhoodListings(
  neighborhoodId: string,
  limit = 50,
  db: Firestore = getAdminDb()
): Promise<Listing[]> {
  if (!isValidNeighborhoodId(neighborhoodId)) return [];
  const snap = await db
    .collection('neighborhoods')
    .doc(neighborhoodId)
    .collection('listings')
    .where('status', '==', 'active')
    .orderBy('recordedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as unknown as Listing));
}
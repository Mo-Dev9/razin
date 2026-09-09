import { useCallback, useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Building } from '@/types';

export interface SavedBuilding {
  id: string;
  address: string;
  city: string;
  area: string;
  governorate?: string;
  overall: number;
  reviewCount: number;
  savedAt: number;
}

export function useSavedBuildings(uid?: string) {
  const [saved, setSaved] = useState<SavedBuilding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      // Clear any stale bookmarks asynchronously (keeps the effect body pure).
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setSaved([]);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const col = collection(getDb(), 'users', uid, 'savedBuildings');
        const snapshot = await getDocs(query(col, orderBy('savedAt', 'desc')));
        if (cancelled) return;
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedBuilding);
        setLoading(false);
        setSaved(items);
      } catch (err) {
        console.error('Load saved buildings failed:', err);
        if (cancelled) return;
        setLoading(false);
        setSaved([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const toggleSave = useCallback(
    async (building: Building): Promise<void> => {
      if (!uid) return;
      const ref = doc(getDb(), 'users', uid, 'savedBuildings', building.id);
      if (saved.some((s) => s.id === building.id)) {
        try {
          await deleteDoc(ref);
          setSaved((prev) => prev.filter((s) => s.id !== building.id));
        } catch (err) {
          console.error('Unsave building failed:', err);
        }
      } else {
        const item: SavedBuilding = {
          id: building.id,
          address: building.address || 'بلا عنوان',
          city: building.city || '',
          area: building.area || '',
          governorate: building.governorate || '',
          overall: building.averageRatings?.overall ?? 0,
          reviewCount: building.reviewCount ?? 0,
          savedAt: Date.now(),
        };
        try {
          await setDoc(ref, item);
          setSaved((prev) => [item, ...prev]);
        } catch (err) {
          console.error('Save building failed:', err);
        }
      }
    },
    [uid, saved]
  );

  const unsave = useCallback(
    async (id: string): Promise<void> => {
      if (!uid) return;
      try {
        await deleteDoc(doc(getDb(), 'users', uid, 'savedBuildings', id));
        setSaved((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        console.error('Unsave building failed:', err);
      }
    },
    [uid]
  );

  const isSaved = useCallback((id: string) => saved.some((s) => s.id === id), [saved]);

  return { saved, loading, toggleSave, unsave, isSaved };
}
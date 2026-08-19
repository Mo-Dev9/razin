import { useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  increment,
  getDoc,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Review, ReviewRatings, Building } from '@/types';

export function useReviews() {
  const [loading, setLoading] = useState(false);

  const getBuildingReviews = useCallback(async (buildingId: string): Promise<Review[]> => {
    try {
        const q = query(
        collection(getDb(), 'reviews'),
        where('buildingId', '==', buildingId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    } catch (err) {
      console.error('Get reviews failed:', err);
      return [];
    }
  }, []);

  const hasUserReviewed = useCallback(async (buildingId: string, userId: string): Promise<boolean> => {
    try {
      const q = query(
        collection(getDb(), 'reviews'),
        where('buildingId', '==', buildingId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch {
      return false;
    }
  }, []);

  const submitReview = useCallback(
    async (buildingId: string, userId: string, ratings: ReviewRatings, comment?: string, floor?: string, apartmentNumber?: string): Promise<boolean> => {
      setLoading(true);
      try {
        const already = await hasUserReviewed(buildingId, userId);
        if (already) return false;

        const overall = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.keys(ratings).length;

        await addDoc(collection(getDb(), 'reviews'), {
          buildingId,
          userId,
          ratings,
          overall,
          comment: comment || '',
          floor: floor || '',
          apartmentNumber: apartmentNumber || '',
          createdAt: Date.now(),
        });

        const buildingRef = doc(getDb(), 'buildings', buildingId);
        const buildingSnap = await getDoc(buildingRef);
        if (buildingSnap.exists()) {
          const b = buildingSnap.data() as Building;
          const count = b.reviewCount;
          const newAvg = (key: keyof ReviewRatings) => {
            const old = b.averageRatings[key] * count;
            return (old + ratings[key]) / (count + 1);
          };

          await updateDoc(buildingRef, {
            averageRatings: {
              noise: newAvg('noise'),
              humidity: newAvg('humidity'),
              landlord: newAvg('landlord'),
              neighbors: newAvg('neighbors'),
              lighting: newAvg('lighting'),
              safety: newAvg('safety'),
              overall: (b.averageRatings.overall * count + overall) / (count + 1),
            },
            reviewCount: increment(1),
            lastReviewAt: Date.now(),
          });
        }

        return true;
      } catch (err) {
        console.error('Submit review failed:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [hasUserReviewed]
  );

  return { getBuildingReviews, hasUserReviewed, submitReview, loading };
}

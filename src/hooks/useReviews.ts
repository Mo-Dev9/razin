import { useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { clearBuildingsCache } from '@/hooks/useBuildings';
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
      const reviewDocId = `${buildingId}_${userId}`;
      const docRef = doc(getDb(), 'reviews', reviewDocId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch {
      return false;
    }
  }, []);

  const submitReview = useCallback(
    async (buildingId: string, userId: string, ratings: ReviewRatings, comment?: string, buildingNumber?: string, floor?: string, apartmentNumber?: string): Promise<boolean> => {
      setLoading(true);
      try {
        const overall = Object.values(ratings).reduce((a, b) => a + b, 0) / Object.keys(ratings).length;

        await runTransaction(getDb(), async (transaction) => {
          const buildingRef = doc(getDb(), 'buildings', buildingId);
          const buildingSnap = await transaction.get(buildingRef);
          if (!buildingSnap.exists()) {
            throw new Error('Building not found');
          }

          const reviewDocId = `${buildingId}_${userId}`;
          const existingRef = doc(getDb(), 'reviews', reviewDocId);
          const existingSnap = await transaction.get(existingRef);
          if (existingSnap.exists()) {
            throw new Error('Already reviewed');
          }

          const b = buildingSnap.data() as Building;
          const count = b.reviewCount;

          transaction.set(existingRef, {
            buildingId,
            userId,
            ratings,
            overall,
            comment: comment || '',
            buildingNumber: buildingNumber || '',
            floor: floor || '',
            apartmentNumber: apartmentNumber || '',
            createdAt: Date.now(),
          });

          const newAvg = (key: keyof ReviewRatings) => {
            const old = (b.averageRatings[key] || 0) * count;
            return (old + ratings[key]) / (count + 1);
          };

          transaction.update(buildingRef, {
            averageRatings: {
              zahma: newAvg('zahma'),
              humidity: newAvg('humidity'),
              landlord: newAvg('landlord'),
              neighbors: newAvg('neighbors'),
              cleanliness: newAvg('cleanliness'),
              safety: newAvg('safety'),
              services: newAvg('services'),
              annoyance: newAvg('annoyance'),
              elevator: newAvg('elevator'),
              maintenance: newAvg('maintenance'),
              ac: newAvg('ac'),
              overall: ((b.averageRatings.overall || 0) * count + overall) / (count + 1),
            },
            reviewCount: increment(1),
            lastReviewAt: Date.now(),
          });

          const userRef = doc(getDb(), 'users', userId);
          const userSnap = await transaction.get(userRef);
          if (userSnap.exists()) {
            transaction.update(userRef, {
              reviewCount: increment(1),
            });
          }
        });

        clearBuildingsCache();
        return true;
      } catch (err) {
        console.error('Submit review failed:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { getBuildingReviews, hasUserReviewed, submitReview, loading };
}

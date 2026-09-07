import { useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '@/lib/firebase';
import { clearBuildingsCache } from '@/hooks/useBuildings';
import type { Review, ReviewRatings, VoteType } from '@/types';

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
      const docRef = doc(getDb(), 'reviews', `${buildingId}_${userId}`);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch {
      return false;
    }
  }, []);

  const getUserReviews = useCallback(async (userId: string): Promise<Review[]> => {
    try {
      const q = query(
        collection(getDb(), 'reviews'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    } catch (err) {
      console.error('Get user reviews failed:', err);
      return [];
    }
  }, []);

  const getBuildingUserVotes = useCallback(
    async (buildingId: string, userId: string): Promise<Record<string, VoteType>> => {
      try {
        const q = query(collection(getDb(), 'votes'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const votes: Record<string, VoteType> = {};
        snapshot.docs.forEach((d) => {
          const data = d.data() as { buildingId: string; reviewId: string; type: VoteType };
          if (
            data.buildingId === buildingId &&
            data.reviewId &&
            (data.type === 'up' || data.type === 'down')
          ) {
            votes[data.reviewId] = data.type;
          }
        });
        return votes;
      } catch (err) {
        console.error('Get building user votes failed:', err);
        return {};
      }
    },
    []
  );

  const voteReview = useCallback(
    async (
      reviewId: string,
      buildingId: string,
      type: VoteType
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const auth = getFirebaseAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return { ok: false, error: 'غير مصرح' };

        const res = await fetch('/api/reviews/vote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewId, buildingId, type }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, error: data.error || 'فشل التصويت' };
        }

        return { ok: true };
      } catch (err) {
        console.error('Vote review failed:', err);
        return { ok: false, error: 'حدث خطأ غير متوقع' };
      }
    },
    []
  );

  const submitReview = useCallback(
    async (
      buildingId: string,
      ratings: ReviewRatings,
      comment?: string,
      buildingNumber?: string,
      floor?: string,
      apartmentNumber?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      setLoading(true);
      try {
        const auth = getFirebaseAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return { ok: false, error: 'غير مصرح' };

        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            buildingId,
            ratings,
            comment,
            buildingNumber,
            floor,
            apartmentNumber,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, error: data.error || 'فشل حفظ التقييم' };
        }

        clearBuildingsCache();
        return { ok: true };
      } catch (err) {
        console.error('Submit review failed:', err);
        return { ok: false, error: 'حدث خطأ غير متوقع' };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateReview = useCallback(
    async (
      buildingId: string,
      ratings: ReviewRatings,
      comment?: string,
      buildingNumber?: string,
      floor?: string,
      apartmentNumber?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      setLoading(true);
      try {
        const auth = getFirebaseAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return { ok: false, error: 'غير مصرح' };

        const res = await fetch('/api/reviews', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            buildingId,
            ratings,
            comment,
            buildingNumber,
            floor,
            apartmentNumber,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, error: data.error || 'فشل تحديث التقييم' };
        }

        clearBuildingsCache();
        return { ok: true };
      } catch (err) {
        console.error('Update review failed:', err);
        return { ok: false, error: 'حدث خطأ غير متوقع' };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteReview = useCallback(
    async (buildingId: string): Promise<{ ok: boolean; error?: string }> => {
      setLoading(true);
      try {
        const auth = getFirebaseAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return { ok: false, error: 'غير مصرح' };

        const res = await fetch(`/api/reviews?buildingId=${encodeURIComponent(buildingId)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, error: data.error || 'فشل حذف التقييم' };
        }

        clearBuildingsCache();
        return { ok: true };
      } catch (err) {
        console.error('Delete review failed:', err);
        return { ok: false, error: 'حدث خطأ غير متوقع' };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    getBuildingReviews,
    getUserReviews,
    hasUserReviewed,
    getBuildingUserVotes,
    voteReview,
    submitReview,
    updateReview,
    deleteReview,
    loading,
  };
}

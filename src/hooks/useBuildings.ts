import { useState, useCallback } from 'react';
import { collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { Building } from '@/types';

let allBuildingsCache: Building[] | null = null;

async function getAllBuildings(): Promise<Building[]> {
  if (allBuildingsCache) return allBuildingsCache;
  const snapshot = await getDocs(collection(getDb(), 'buildings'));
  allBuildingsCache = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Building));
  return allBuildingsCache;
}

function matchesSearch(building: Building, q: string): boolean {
  const fields = [
    building.area,
    building.city,
    building.address,
    building.district,
    building.buildingNumber,
    building.floor,
    building.apartmentNumber,
  ].filter(Boolean).map((f) => f!.toLowerCase());
  return fields.some((f) => f.includes(q));
}

export function useBuildings() {
  const [loading, setLoading] = useState(false);

  const searchBuildings = useCallback(async (searchQuery: string): Promise<Building[]> => {
    setLoading(true);
    try {
      const q = searchQuery.toLowerCase().trim();
      const buildings = await getAllBuildings();
      return buildings.filter((b) => matchesSearch(b, q));
    } catch (err) {
      console.error('Search failed:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getBuilding = useCallback(async (id: string): Promise<Building | null> => {
    try {
      const docSnap = await getDoc(doc(getDb(), 'buildings', id));
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Building) : null;
    } catch (err) {
      console.error('Get building failed:', err);
      return null;
    }
  }, []);

  const addBuilding = useCallback(async (data: {
    address: string;
    city: string;
    area: string;
    district?: string;
  }): Promise<string | null> => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(getDb(), 'buildings'), {
        ...data,
        averageRatings: { noise: 0, humidity: 0, landlord: 0, neighbors: 0, lighting: 0, safety: 0, overall: 0 },
        reviewCount: 0,
        createdAt: Date.now(),
      });
      allBuildingsCache = null;
      return docRef.id;
    } catch (err) {
      console.error('Add building failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchBuildings, getBuilding, addBuilding, loading };
}

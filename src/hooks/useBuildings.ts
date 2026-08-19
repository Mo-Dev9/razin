import { useState, useCallback } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
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

  return { searchBuildings, getBuilding, loading };
}

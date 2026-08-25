import { useState, useCallback } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '@/lib/firebase';
import type { Building } from '@/types';

let allBuildingsCache: Building[] | null = null;

export function clearBuildingsCache() {
  allBuildingsCache = null;
}

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

  const searchBuildingsAdvanced = useCallback(async (filters: { city?: string; district?: string; hasReviews?: boolean }): Promise<Building[]> => {
    setLoading(true);
    try {
      const buildings = await getAllBuildings();
      return buildings.filter((b) => {
        if (filters.city && b.city !== filters.city) return false;
        if (filters.district && b.district !== filters.district) return false;
        if (filters.hasReviews && b.reviewCount === 0) return false;
        return true;
      });
    } catch (err) {
      console.error('Advanced search failed:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllCities = useCallback(async (): Promise<string[]> => {
    const buildings = await getAllBuildings();
    const cities = [...new Set(buildings.map((b) => b.city).filter(Boolean))];
    return cities.sort();
  }, []);

  const getAllDistricts = useCallback(async (city?: string): Promise<string[]> => {
    const buildings = await getAllBuildings();
    const filtered = city ? buildings.filter((b) => b.city === city) : buildings;
    const districts = [...new Set(filtered.map((b) => b.district).filter((d): d is string => !!d))];
    return districts.sort();
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
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return null;

      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      if (!res.ok) return null;

      const result = await res.json();
      allBuildingsCache = null;
      return result.buildingId ?? null;
    } catch (err) {
      console.error('Add building failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchBuildings, searchBuildingsAdvanced, getAllCities, getAllDistricts, getBuilding, addBuilding, loading };
}

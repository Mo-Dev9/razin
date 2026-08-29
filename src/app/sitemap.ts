import type { MetadataRoute } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';

const BASE_URL = 'https://rentrate-zeta.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  let buildingRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminDb();
    const snap = await db.collection('buildings').orderBy('createdAt', 'desc').get();
    buildingRoutes = snap.docs.map((doc) => ({
      url: `${BASE_URL}/building/${doc.id}`,
      lastModified: new Date(doc.data().lastReviewAt || doc.data().createdAt || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // If Firestore query fails, return static routes only
  }

  return [...staticRoutes, ...buildingRoutes];
}

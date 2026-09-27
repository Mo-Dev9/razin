import type { MetadataRoute } from 'next';
import { EGYPT_GOVERNORATES } from '@/lib/egypt-cities';
import { neighborhoodKey } from '@/lib/listing-utils';

const BASE_URL = 'https://razin-eg.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  for (const gov of EGYPT_GOVERNORATES) {
    for (const place of gov.places) {
      entries.push({
        url: `${BASE_URL}/neighborhood/${encodeURIComponent(neighborhoodKey(place.name, gov.name))}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return entries;
}
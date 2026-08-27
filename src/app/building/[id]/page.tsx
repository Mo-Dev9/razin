import type { Metadata } from 'next';
import BuildingPageInner from './BuildingPageInner';
import { getAdminDb } from '@/lib/firebase-admin';

type Props = {
  params: Promise<{ id: string }>;
};

const BASE_URL = 'https://rentrate-zeta.vercel.app';

async function fetchBuilding(id: string) {
  try {
    const db = getAdminDb();
    const doc = await db.collection('buildings').doc(id).get();
    return doc.exists ? doc.data() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchBuilding(id);

  if (data) {
    const address = data.address || 'مبنى';
    const area = data.area || '';
    const city = data.city || '';
    const location = [area, city].filter(Boolean).join('، ');

    return {
      title: `${address} — تقييمات السكان | RentRate`,
      description: `تقييمات مجهولة لمبنى ${address} في ${location}: الزحمة، الأمان، الجيران، النظافة وتعاون المالك. اقرأ التجارب قبل ما توقّع عقد الإيجار.`,
      alternates: { canonical: `/building/${id}` },
      openGraph: {
        title: `${address} — تقييمات السكان | RentRate`,
        description: `تقييمات مجهولة من مستأجرين سابقين في ${address}، ${location}.`,
        url: `${BASE_URL}/building/${id}`,
        siteName: 'RentRate',
        locale: 'ar_EG',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${address} — تقييمات السكان | RentRate`,
        description: `تقييمات مجهولة من مستأجرين سابقين في ${address}، ${location}.`,
      },
    };
  }

  return {
    title: 'تقييمات المبنى | RentRate',
    description: 'تفاصيل تقييمات المبنى من المستأجرين السابقين.',
  };
}

export default async function BuildingPage({ params }: Props) {
  const { id } = await params;
  const data = await fetchBuilding(id);

  let jsonLd: Record<string, unknown> | null = null;
  if (data) {
    const address = data.address || 'مبنى';
    const area = data.area || '';
    const city = data.city || '';
    const reviewCount = data.reviewCount || 0;
    const avgOverall = data.averageRatings?.overall || 0;

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ApartmentComplex',
      name: address,
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: area,
        addressCountry: 'EG',
      },
      url: `${BASE_URL}/building/${id}`,
      ...(reviewCount > 0 && avgOverall > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: avgOverall.toFixed(1),
              bestRating: '5',
              worstRating: '1',
              ratingCount: reviewCount,
            },
          }
        : {}),
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BuildingPageInner buildingId={id} />
    </>
  );
}

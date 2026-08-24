import type { Metadata } from 'next';
import BuildingPageInner from './BuildingPageInner';
import { getAdminDb } from '@/lib/firebase-admin';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const db = getAdminDb();
    const doc = await db.collection('buildings').doc(id).get();
    const data = doc.data();

    if (data) {
      const address = data.address || 'مبنى';
      const area = data.area || '';
      const city = data.city || '';
      const location = [area, city].filter(Boolean).join('، ');

      return {
        title: `${address} — تقييمات السكان | RentRate`,
        description: `تقييمات مجهولة لمبنى ${address} في ${location}: الزحمة، الأمان، الجيران، النظافة وتعاون المالك. اقرأ التجارب قبل ما توقّع عقد الإيجار.`,
        openGraph: {
          title: `${address} — تقييمات السكان | RentRate`,
          description: `تقييمات مجهولة من مستأجرين سابقين في ${address}، ${location}.`,
          url: `https://rentrate-zeta.vercel.app/building/${id}`,
          siteName: 'RentRate',
          locale: 'ar_EG',
          type: 'website',
        },
      };
    }
  } catch {
    // Fallback if Firestore query fails
  }

  return {
    title: 'تقييمات المبنى | RentRate',
    description: 'تفاصيل تقييمات المبنى من المستأجرين السابقين.',
  };
}

export default async function BuildingPage({ params }: Props) {
  const { id } = await params;
  return <BuildingPageInner buildingId={id} />;
}

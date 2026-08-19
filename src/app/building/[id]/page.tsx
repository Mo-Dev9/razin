import type { Metadata } from 'next';
import BuildingPageInner from './BuildingPageInner';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `مبنى ${id} — RentRate`,
    description: 'تفاصيل تقييمات المبنى من المستأجرين السابقين.',
    openGraph: {
      title: `تقييمات المبنى — RentRate`,
      description: 'تفاصيل تقييمات المبنى من المستأجرين السابقين.',
      type: 'website',
    },
  };
}

export default async function BuildingPage({ params }: Props) {
  const { id } = await params;
  return <BuildingPageInner buildingId={id} />;
}

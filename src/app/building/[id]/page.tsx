import type { Metadata } from 'next';
import BuildingPageInner from './BuildingPageInner';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `مبنى ${id}`,
    description: 'تفاصيل تقييمات المبنى من المستأجرين السابقين.',
  };
}

export default async function BuildingPage({ params }: Props) {
  const { id } = await params;
  return <BuildingPageInner buildingId={id} />;
}

import type { Metadata } from 'next';
import RatePageInner from './RatePageInner';

export const metadata: Metadata = {
  title: 'قيّم المبنى — RentRate',
  description: 'قيّم تجربتك في المبنى وساعد المستأجرين الجايين.',
};

export default async function RatePage({ params }: { params: Promise<{ buildingId: string }> }) {
  const { buildingId } = await params;
  return <RatePageInner buildingId={buildingId} />;
}

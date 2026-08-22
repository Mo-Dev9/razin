import type { Metadata } from 'next';
import RatePageInner from './RatePageInner';

export const metadata: Metadata = {
  title: 'قيّم تجربتك — RentRate',
  description: 'شارك تجربتك في سكن أي مبنى بمجهول تام: قيّم الطرقبة، الرطوبة، الجيران، الأمان والإضاءة من 5 وساعد غيرك ياخذ قرار صح.',
};

export default async function RatePage({ params }: { params: Promise<{ buildingId: string }> }) {
  const { buildingId } = await params;
  return <RatePageInner buildingId={buildingId} />;
}

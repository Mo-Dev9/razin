import type { Metadata } from 'next';
import RatePageInner from './RatePageInner';

export const metadata: Metadata = {
  title: 'قيّم تجربتك — RentRate',
  description: 'شارك تجربتك في سكن أي مبنى بمجهول تام: قيّم الزحمة، الرطوبة، الجيران، الأمان، النظافة والإزعاج من 5 وساعد غيرك ياخذ قرار صح.',
  openGraph: {
    title: 'قيّم تجربتك — RentRate',
    description: 'شارك تجربتك في سكن أي مبنى بمجهول تام وقيّم المعايير الحادية عشرة.',
    url: 'https://rentrate-zeta.vercel.app/rate',
    siteName: 'RentRate',
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'قيّم تجربتك — RentRate',
    description: 'شارك تجربتك في سكن أي مبنى بمجهول تام وقيّم المعايير الحادية عشرة.',
  },
};

export default async function RatePage({ params }: { params: Promise<{ buildingId: string }> }) {
  const { buildingId } = await params;
  return <RatePageInner buildingId={buildingId} />;
}

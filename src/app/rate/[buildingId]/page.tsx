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

export default async function RatePage({ params, searchParams }: { params: Promise<{ buildingId: string }>, searchParams: Promise<{ edit?: string }> }) {
  const { buildingId } = await params;
  const { edit } = await searchParams;
  return <RatePageInner buildingId={buildingId} isEditing={edit === '1'} />;
}

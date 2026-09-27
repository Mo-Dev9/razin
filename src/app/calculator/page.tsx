import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Calculator } from '@/components/calculator/Calculator';
import { placeByNeighborhoodId } from '@/lib/neighborhood-search';

export const metadata: Metadata = {
  title: 'حاسبة أسعار الإيجار',
  description:
    'احسب نطاق سعر إيجار الشقة في أي حي مصري: اختر المحافظة والحي ومواصفات الشقة (غرف، حمامات) واحصل على السعر الوسطي والنطاق الشائع فورًا.',
  openGraph: {
    title: 'حاسبة أسعار الإيجار — رزين',
    description: 'حدد حيّك ومواصفات شقتك واحصل على نطاق السعر الشائع من إعلانات السوق الموثقة.',
    locale: 'ar_EG',
    type: 'website',
  },
};

interface Props {
  searchParams: Promise<{ neighborhoodId?: string }>;
}

export default async function CalculatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const neighborhoodId = params.neighborhoodId ?? '';
  const validPreset = neighborhoodId && placeByNeighborhoodId(neighborhoodId) ? neighborhoodId : '';

  return (
    <>
      <SiteHeader />
      <main>
        <Calculator key={validPreset} initialNeighborhoodId={validPreset} />
      </main>
      <SiteFooter />
    </>
  );
}
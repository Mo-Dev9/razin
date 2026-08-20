import type { Metadata } from 'next';
import HomePageInner from './HomePageInner';

export const metadata: Metadata = {
  title: 'RentRate — اعرف الحقيقة قبل ما تتعاقد',
  description: 'تقييمات شقق ومباني سكنية من مستأجرين حقيقيين. اعرف تفاصيل الحياة في المبنى قبل ما توقّع.',
  openGraph: {
    title: 'RentRate — اعرف الحقيقة قبل ما تتعاقد',
    description: 'تقييمات شقق ومباني سكنية من مستأجرين حقيقيين. اعرف تفاصيل الحياة في المبنى قبل ما توقّع.',
    url: 'https://rentrate-zeta.vercel.app',
    siteName: 'RentRate',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default function Page() {
  return <HomePageInner />;
}

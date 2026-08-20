import type { Metadata } from 'next';
import HomePageInner from './HomePageInner';

export const metadata: Metadata = {
  title: 'تقييم — دليل الجيران للعيش اليومي',
  description: 'تقييم يساعدك تعرف تفاصيل الحياة في المبنى — من صوت الشارع إلى تعاون المالك — من ناس عاشوا هناك فعلاً.',
  openGraph: {
    title: 'تقييم — دليل الجيران للعيش اليومي',
    description: 'تقييم يساعدك تعرف تفاصيل الحياة في المبنى — من صوت الشارع إلى تعاون المالك — من ناس عاشوا هناك فعلاً.',
    url: 'https://rentrate-zeta.vercel.app',
    siteName: 'تقييم',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default function Page() {
  return <HomePageInner />;
}

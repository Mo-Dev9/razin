import type { Metadata } from 'next';
import HomePageInner from './HomePageInner';

export const metadata: Metadata = {
  title: 'RentRate — اعرف الحقيقة قبل ما تتعاقد',
  description: 'اكتشف تقييمات حقيقية للمباني والشقق في مصر من مستأجرين مجهولي الهوية: الطرقبة، الأمان، الجيران وتعاون المالك. اعرف الحقيقة قبل ما تتعاقد.',
  openGraph: {
    title: 'RentRate — اعرف الحقيقة قبل ما تتعاقد',
    description: 'اكتشف تقييمات حقيقية للمباني والشقق في مصر من مستأجرين مجهولي الهوية. اعرف الحقيقة قبل ما تتعاقد.',
    url: 'https://rentrate-zeta.vercel.app',
    siteName: 'RentRate',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default function Page() {
  return <HomePageInner />;
}

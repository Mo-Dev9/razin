import type { Metadata } from 'next';
import HomePageInner from './HomePageInner';

export const metadata: Metadata = {
  title: 'RentRate — تقييم الشقق والمباني في مصر',
  description: 'اعرف الحقيقة قبل ما تتعاقد. تقييمات حقيقية من سكان حقيقيين للشقق والمباني السكنية في مصر.',
  openGraph: {
    title: 'RentRate — تقييم الشقق والمباني في مصر',
    description: 'اعرف الحقيقة قبل ما تتعاقد. تقييمات حقيقية من سكان حقيقيين.',
    url: 'https://rentrate-zeta.vercel.app',
    siteName: 'RentRate',
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentRate — تقييم الشقق والمباني في مصر',
    description: 'اعرف الحقيقة قبل ما تتعاقد. تقييمات حقيقية من سكان حقيقيين.',
  },
};

export default function Page() {
  return <HomePageInner />;
}

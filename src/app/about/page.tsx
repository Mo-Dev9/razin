import type { Metadata } from 'next';
import AboutPageInner from './AboutPageInner';

export const metadata: Metadata = {
  title: 'عنا — RentRate',
  description: 'قصة RentRate — ليه عملنا الموقع ده، وإزاي بيساعدك تختار مكان سكنك بذكاء.',
  alternates: { canonical: '/about' },
  openGraph: { title: ' RentRate — عنا', description: 'قصة RentRate — ليه عملنا الموقع ده.' },
  twitter: { card: 'summary', title: ' RentRate — عنا', description: 'قصة RentRate — ليه عملنا الموقع ده.' },
};

export default function AboutPage() {
  return <AboutPageInner />;
}

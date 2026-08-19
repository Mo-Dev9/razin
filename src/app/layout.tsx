import type { Metadata, Viewport } from 'next';
import './globals.css';

const BASE_URL = 'https://rentrate-zeta.vercel.app';

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'RentRate — تقييم الشقق والمباني في مصر',
    template: '%s | RentRate',
  },
  description: 'اكتشف تقييمات الشقق والمباني السكنية قبل التوقيع. تقييمات حقيقية من سكان حقيقيين.',
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: BASE_URL,
    siteName: 'RentRate',
    title: 'RentRate — تقييم الشقق والمباني في مصر',
    description: 'اعرف الحقيقة قبل ما تتعاقد. تقييمات حقيقية من سكان حقيقيين.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentRate — تقييم الشقق والمباني في مصر',
    description: 'اعرف الحقيقة قبل ما تتعاقد. تقييمات حقيقية من سكان حقيقيين.',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'ar': BASE_URL,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}

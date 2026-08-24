import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import './globals.css';

const BASE_URL = 'https://rentrate-zeta.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'RentRate — اعرف الحقيقة قبل ما تتعاقد',
    template: '%s | RentRate',
  },
  description: 'تقييمات شقق ومباني سكنية من مستأجرين حقيقيين. اعرف تفاصيل الحياة في المبنى قبل ما توقّع.',
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: BASE_URL,
    siteName: 'RentRate',
    title: 'RentRate — اعرف الحقيقة قبل ما تتعاقد',
    description: 'تقييمات شقق ومباني سكنية من مستأجرين حقيقيين. اعرف تفاصيل الحياة في المبنى قبل ما توقّع.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentRate — اعرف الحقيقة قبل ما تتعاقد',
    description: 'تقييمات شقق ومباني سكنية من مستأجرين حقيقيين. اعرف تفاصيل الحياة في المبنى قبل ما توقّع.',
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RentRate',
  },
};

export const viewport: Viewport = {
  themeColor: '#0F2C2C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/logo-192.png" />
      </head>
      <body className="flex flex-col min-h-screen">
        {children}
        <ServiceWorkerRegistration />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

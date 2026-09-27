import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ProfileView } from './ProfileView';

export const metadata: Metadata = {
  title: 'ملفي — رزين',
  description: 'هويتك المجهولة في «حارة» ومنشوراتك — بلا أسماء حقيقية ولا تخصيص.',
};

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <ProfileView />
      </main>
      <SiteFooter />
    </>
  );
}
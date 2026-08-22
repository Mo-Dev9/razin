import type { Metadata } from 'next';
import ProfilePageInner from './ProfilePageInner';

export const metadata: Metadata = {
  title: 'ملفي — RentRate',
  description: 'ملفك ومساهماتك على RentRate.',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfilePageInner />;
}

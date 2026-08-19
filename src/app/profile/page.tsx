import type { Metadata } from 'next';
import ProfilePageInner from './ProfilePageInner';

export const metadata: Metadata = {
  title: 'حسابي — RentRate',
  description: 'حسابك وتقييماتك على RentRate.',
};

export default function ProfilePage() {
  return <ProfilePageInner />;
}

import type { Metadata } from 'next';
import ProfilePageInner from './ProfilePageInner';

export const metadata: Metadata = {
  title: 'ملفي',
  description: 'ملفك ومساهماتك على تقييم.',
};

export default function ProfilePage() {
  return <ProfilePageInner />;
}

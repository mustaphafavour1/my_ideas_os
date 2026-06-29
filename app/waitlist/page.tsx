import type { Metadata } from 'next';
import { WaitlistPage } from '@/components/waitlist/WaitlistPage';

export const metadata: Metadata = {
  title: 'Idea OS — Your AI Journey, Visualized',
  description:
    'The personal intelligence dashboard for AI builders. Track your ideas, understand your conversation patterns, and unlock your builder profile.',
};

export default function WaitlistRoute() {
  return <WaitlistPage />;
}

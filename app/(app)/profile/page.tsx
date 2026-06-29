export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { createServiceClient } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { Idea, UserStats } from '@/lib/types';

async function getData(userId: string) {
  const supabase = createServiceClient();
  const [{ data: ideas }, { data: stats }] = await Promise.all([
    supabase.from('ideas').select('*').eq('user_id', userId),
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
  ]);
  return {
    ideas: (ideas || []) as Idea[],
    stats: stats as UserStats | null,
  };
}

function topEntries(items: (string | null)[]): { label: string; count: number }[] {
  const counts: Record<string, number> = {};
  items.forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label: label.replace(/_/g, ' '), count }));
}

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const { ideas, stats } = await getData(user.id);

  const completed = ideas.filter((i) => i.status === 'completed').length;
  const inProgress = ideas.filter((i) => i.status === 'in_progress').length;
  const topSectors = topEntries(ideas.map((i) => i.sector));
  const completionPct = ideas.length > 0 ? Math.round((completed / ideas.length) * 100) : 0;

  const firstConvDate = stats?.first_conversation_at
    ? new Date(stats.first_conversation_at)
    : null;
  const monthsExp = firstConvDate
    ? Math.max(1, Math.round((Date.now() - firstConvDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
    : null;

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Profile" subtitle="Your AI builder profile" />
      <ProfileContent
        ideas={ideas}
        stats={stats}
        completed={completed}
        inProgress={inProgress}
        completionPct={completionPct}
        monthsExp={monthsExp}
        topSectors={topSectors}
      />
    </div>
  );
}

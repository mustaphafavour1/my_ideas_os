export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { createServiceClient } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { Idea, UserStats } from '@/lib/types';
import { computeDashboardProps } from '@/lib/dashboard-utils';

async function getDashboardData(userId: string, range: string, rangeFrom?: string, rangeTo?: string, rangeOffset?: string) {
  const supabase = createServiceClient();

  const [{ data: ideas }, { data: syncLog }, { data: inboxItems }, { data: userStats }, { data: userRow }] =
    await Promise.all([
      supabase.from('ideas').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('sync_log').select('synced_at').eq('user_id', userId).order('synced_at', { ascending: false }).limit(1),
      supabase.from('inbox').select('id').eq('user_id', userId).eq('processed', false),
      supabase.from('user_stats').select('*').eq('user_id', userId).single(),
      supabase.from('users').select('plan').eq('id', userId).single(),
    ]);

  return {
    userPlan: (userRow?.plan ?? null) as string | null,
    ...computeDashboardProps(
      (ideas || []) as Idea[],
      (userStats as UserStats | null),
      syncLog?.[0]?.synced_at || null,
      (inboxItems || []).length,
      range,
      rangeFrom,
      rangeTo,
      rangeOffset,
    ),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; offset?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { range = 'all', from, to, offset } = await searchParams;
  const { lastSynced, userPlan, ...contentProps } = await getDashboardData(user.id, range, from, to, offset);

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Dashboard"
        subtitle={`${contentProps.stats.total} ideas total`}
        lastSynced={lastSynced}
        userPlan={userPlan}
      />
      <DashboardContent {...contentProps} />
    </div>
  );
}

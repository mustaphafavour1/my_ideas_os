export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { createServiceClient } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { Idea, UserStats } from '@/lib/types';
import { computeDashboardProps } from '@/lib/dashboard-utils';

async function getDashboardData(userId: string, range: string, rangeFrom?: string, rangeTo?: string) {
  const supabase = createServiceClient();

  const [{ data: ideas }, { data: syncLog }, { data: inboxItems }, { data: userStats }] =
    await Promise.all([
      supabase.from('ideas').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('sync_log').select('synced_at').eq('user_id', userId).order('synced_at', { ascending: false }).limit(1),
      supabase.from('inbox').select('id').eq('user_id', userId).eq('processed', false),
      supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    ]);

  return computeDashboardProps(
    (ideas || []) as Idea[],
    (userStats as UserStats | null),
    syncLog?.[0]?.synced_at || null,
    (inboxItems || []).length,
    range,
    rangeFrom,
    rangeTo,
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { range = 'all', from, to } = await searchParams;
  const { lastSynced, ...contentProps } = await getDashboardData(user.id, range, from, to);

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Dashboard"
        subtitle={`${contentProps.stats.total} ideas total`}
        lastSynced={lastSynced}
      />
      <DashboardContent {...contentProps} />
    </div>
  );
}

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { getRangeCutoff } from '@/lib/dashboard-utils';
import { filterIdeasByRange, filterLogsByRange, computeStreaks, buildInsights, avgDaysBetweenChats, fmt } from '@/lib/analytics-utils';
import { Idea, ConversationLog, UserStats } from '@/lib/types';
import { AnalyticsContent } from '@/components/analytics/AnalyticsContent';

async function getData(userId: string) {
  const supabase = createServiceClient();
  const [{ data: ideas }, { count: syncCount }, { data: logs }, { data: userStats }] = await Promise.all([
    supabase.from('ideas').select('*').eq('user_id', userId),
    supabase.from('sync_log').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('conversations_log').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
  ]);
  return {
    ideas: (ideas || []) as Idea[],
    syncCount: syncCount || 0,
    logs: (logs || []) as ConversationLog[],
    userStats: (userStats as UserStats | null),
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; offset?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { range = 'all', from, to, offset } = await searchParams;
  const { ideas: allIdeas, syncCount, logs: allLogs, userStats } = await getData(user.id);

  const cutoff = getRangeCutoff(range, from, to, offset);
  const ideas = filterIdeasByRange(allIdeas, cutoff);
  const logs = filterLogsByRange(allLogs, cutoff);

  const inProgress = ideas.filter((i) => i.status === 'in_progress').length;
  const completed = ideas.filter((i) => i.status === 'completed').length;
  const insights = buildInsights(ideas);

  const streaks = computeStreaks(allLogs);

  const avgPromptWords = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + (l.human_messages > 0 ? l.human_words / l.human_messages : 0), 0) / logs.length)
    : 0;

  const metricCards = [
    { label: 'Total Ideas', value: ideas.length },
    { label: 'In Progress', value: inProgress },
    { label: 'Completed', value: completed },
    { label: 'Syncs Done', value: syncCount },
    { label: 'Avg Days / Idea', value: avgDaysBetweenChats(ideas) },
  ];

  const convMetricCards = userStats
    ? [
        { label: 'Conversations',   value: fmt(logs.length > 0 ? logs.length : userStats.total_conversations) },
        { label: 'Total Words',      value: fmt(logs.length > 0 ? logs.reduce((s, l) => s + l.total_words, 0) : userStats.total_words) },
        { label: 'Code Lines',       value: fmt(logs.length > 0 ? logs.reduce((s, l) => s + l.code_lines, 0) : userStats.total_code_lines) },
        { label: 'Avg Prompt Words', value: avgPromptWords || '—' },
        { label: 'Current Streak',   value: `${streaks.current}d` },
        { label: 'Longest Streak',   value: `${streaks.longest}d` },
      ]
    : null;

  return (
    <AnalyticsContent
      range={range}
      from={from}
      to={to}
      offset={offset}
      ideas={ideas}
      allIdeasCount={allIdeas.length}
      logs={logs}
      allLogs={allLogs}
      inProgress={inProgress}
      completed={completed}
      insights={insights}
      metricCards={metricCards}
      convMetricCards={convMetricCards}
    />
  );
}

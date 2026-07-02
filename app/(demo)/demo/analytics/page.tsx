import { getRangeCutoff } from '@/lib/dashboard-utils';
import { filterIdeasByRange, filterLogsByRange, computeStreaks, buildInsights, avgDaysBetweenChats, fmt } from '@/lib/analytics-utils';
import { DEMO_IDEAS, DEMO_CONVERSATIONS_LOG, DEMO_USER_STATS } from '@/lib/demo-data';
import { Idea, ConversationLog } from '@/lib/types';
import { AnalyticsContent } from '@/components/analytics/AnalyticsContent';

const allIdeas = DEMO_IDEAS as unknown as Idea[];
const allLogs = DEMO_CONVERSATIONS_LOG as unknown as ConversationLog[];

export default async function DemoAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; offset?: string }>;
}) {
  const { range = 'all', from, to, offset } = await searchParams;

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
    { label: 'Syncs Done', value: allLogs.length },
    { label: 'Avg Days / Idea', value: avgDaysBetweenChats(ideas) },
  ];

  const convMetricCards = [
    { label: 'Conversations',   value: fmt(logs.length > 0 ? logs.length : DEMO_USER_STATS.total_conversations) },
    { label: 'Total Words',      value: fmt(logs.length > 0 ? logs.reduce((s, l) => s + l.total_words, 0) : DEMO_USER_STATS.total_words) },
    { label: 'Code Lines',       value: fmt(logs.length > 0 ? logs.reduce((s, l) => s + l.code_lines, 0) : DEMO_USER_STATS.total_code_lines) },
    { label: 'Avg Prompt Words', value: avgPromptWords || '—' },
    { label: 'Current Streak',   value: `${streaks.current}d` },
    { label: 'Longest Streak',   value: `${streaks.longest}d` },
  ];

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

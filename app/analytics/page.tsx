export const dynamic = 'force-dynamic';

import { TopBar } from '@/components/layout/TopBar';
import {
  IdeasByTypeChart,
  IdeasByStatusChart,
  GradeDistributionChart,
  IdeasTimelineChart,
  CompletionRing,
  AvgGradeRing,
  TopSectorsChart,
  ConversationsTimelineChart,
} from '@/components/analytics/Charts';
import { TimeRangeFilter } from '@/components/ui/TimeRangeFilter';
import { createServiceClient } from '@/lib/supabase';
import { Idea, ConversationLog, UserStats } from '@/lib/types';
import { DEMO_CONVERSATIONS_LOG, DEMO_USER_STATS } from '@/lib/demo-data';

async function getData() {
  const supabase = createServiceClient();
  const [{ data: ideas }, { count: syncCount }, { data: logs }, { data: userStats }] = await Promise.all([
    supabase.from('ideas').select('*').eq('user_id', 'favour'),
    supabase.from('sync_log').select('*', { count: 'exact', head: true }).eq('user_id', 'favour'),
    supabase.from('conversations_log').select('*').eq('user_id', 'favour').order('created_at', { ascending: true }),
    supabase.from('user_stats').select('*').eq('user_id', 'favour').single(),
  ]);
  const allIdeas = (ideas || []) as Idea[];
  const isDemoActive = allIdeas.some((i) => i.source_ref === 'demo_mode');
  const effectiveLogs = (logs && logs.length > 0)
    ? (logs as ConversationLog[])
    : isDemoActive ? ([...DEMO_CONVERSATIONS_LOG].sort((a, b) => a.created_at.localeCompare(b.created_at)) as unknown as ConversationLog[]) : [];
  const effectiveStats = (userStats as UserStats | null) ?? (isDemoActive ? DEMO_USER_STATS : null);
  return {
    ideas: allIdeas,
    syncCount: syncCount || 0,
    logs: effectiveLogs,
    userStats: effectiveStats,
  };
}

function getRangeCutoff(range: string, from?: string, to?: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (range) {
    case 'today': {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      return { from: start, to: null };
    }
    case 'week':
      return { from: new Date(now.getTime() - 7 * 86400000), to: null };
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      return { from: new Date(now.getFullYear(), q * 3, 1), to: null };
    }
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to: null };
    case 'custom':
      return { from: from ? new Date(from) : null, to: to ? new Date(to) : null };
    default:
      return { from: null, to: null };
  }
}

function filterByRange<T extends { created_at: string }>(items: T[], cutoff: { from: Date | null; to: Date | null }): T[] {
  if (!cutoff.from && !cutoff.to) return items;
  return items.filter((i) => {
    const d = new Date(i.created_at);
    if (cutoff.from && d < cutoff.from) return false;
    if (cutoff.to && d > cutoff.to) return false;
    return true;
  });
}

function computeStreaks(logs: ConversationLog[]): { current: number; longest: number } {
  if (logs.length === 0) return { current: 0, longest: 0 };
  const dates = [...new Set(logs.map((l) => l.created_at.split('T')[0]))].sort();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let longest = 1, streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    streak = diff === 1 ? streak + 1 : 1;
    if (streak > longest) longest = streak;
  }

  let current = 0;
  const lastDate = dates[dates.length - 1];
  if (lastDate === today || lastDate === yesterday) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const diff = (new Date(dates[i + 1]).getTime() - new Date(dates[i]).getTime()) / 86400000;
      if (diff === 1) current++;
      else break;
    }
  }
  return { current, longest };
}

function ChartCard({ title, subtitle, children, tall }: { title: string; subtitle?: string; children: React.ReactNode; tall?: boolean }) {
  return (
    <div className={`bg-[#111118] border border-[#1E1E2E] rounded-xl flex flex-col ${tall ? 'h-full' : ''}`}>
      <div className="px-6 pt-6 pb-4 border-b border-[#1A1A28]">
        <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">{title}</h3>
        {subtitle && <p className="text-[11px] text-[#3A3A55] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6 flex-1">
        {children}
      </div>
    </div>
  );
}

function buildInsights(ideas: Idea[]): string[] {
  const insights: string[] = [];
  const typeCounts: Record<string, { completed: number; inProgress: number; total: number; blocked: number }> = {};
  ideas.forEach((i) => {
    const type = i.idea_type || 'untyped';
    if (!typeCounts[type]) typeCounts[type] = { completed: 0, inProgress: 0, total: 0, blocked: 0 };
    typeCounts[type].total++;
    if (i.status === 'completed') typeCounts[type].completed++;
    if (i.status === 'in_progress') typeCounts[type].inProgress++;
    if (i.blockers && i.blockers.length > 0) typeCounts[type].blocked++;
  });
  Object.entries(typeCounts).sort((a, b) => b[1].total - a[1].total).slice(0, 4).forEach(([type, counts]) => {
    const label = type.replace(/_/g, ' ');
    if (counts.completed > 0) insights.push(`${counts.completed} ${label} idea${counts.completed !== 1 ? 's' : ''} completed`);
    if (counts.inProgress > 0) insights.push(`${counts.inProgress} ${label} idea${counts.inProgress !== 1 ? 's' : ''} in progress`);
    if (counts.blocked > 0) insights.push(`${counts.blocked} ${label} idea${counts.blocked !== 1 ? 's' : ''} ${counts.blocked !== 1 ? 'have' : 'has'} blockers`);
  });
  const paused = ideas.filter((i) => i.status === 'paused').length;
  if (paused > 0) insights.push(`${paused} idea${paused !== 1 ? 's' : ''} currently paused`);
  return insights.slice(0, 6);
}

function avgDaysBetweenChats(ideas: Idea[]): string {
  const withDates = ideas.filter((i) => i.chat_date && i.updated_at);
  if (withDates.length === 0) return '—';
  const diffs = withDates.map((i) => Math.abs(new Date(i.updated_at).getTime() - new Date(i.chat_date!).getTime()) / 86400000);
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return avg < 1 ? '<1' : Math.round(avg).toString();
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { range = 'all', from, to } = await searchParams;
  const { ideas: allIdeas, syncCount, logs: allLogs, userStats } = await getData();

  const cutoff = getRangeCutoff(range, from, to);
  const ideas = filterByRange(allIdeas, cutoff);
  const logs = filterByRange(allLogs, cutoff);

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
    <div className="flex flex-col flex-1">
      <TopBar title="Analytics" subtitle={`${ideas.length} ideas · ${inProgress} active · ${completed} shipped`} />

      <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-6xl mx-auto w-full">
        {/* Time range filter */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <TimeRangeFilter currentRange={range} currentFrom={from} currentTo={to} />
          {range !== 'all' && (
            <p className="text-[10px] font-mono text-[#3A3A55]">
              {ideas.length} of {allIdeas.length} ideas
            </p>
          )}
        </div>

        {ideas.length === 0 && logs.length === 0 ? (
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center">
            <p className="text-[12px] text-[#3A3A55] font-mono">No data for this time range</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Idea metrics */}
            {ideas.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {metricCards.map(({ label, value }) => (
                  <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
                    <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                    <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Completion + AvgGrade + Ideas over time */}
            {ideas.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-[200px_200px_1fr] gap-5">
                <ChartCard title="Completion Rate" tall>
                  <CompletionRing ideas={ideas} />
                </ChartCard>
                <ChartCard title="Avg Idea Grade" tall>
                  <AvgGradeRing ideas={ideas} />
                </ChartCard>
                <ChartCard title="Ideas Over Time" subtitle="captured per month">
                  <IdeasTimelineChart ideas={ideas} />
                </ChartCard>
              </div>
            )}

            {/* Conversation stats — placed right after ideas-over-time */}
            {convMetricCards && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {convMetricCards.map(({ label, value }) => (
                    <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
                      <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                      <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
                    </div>
                  ))}
                </div>

                <ChartCard title="Conversations Over Time" subtitle="messages per month">
                  <ConversationsTimelineChart logs={logs.length > 0 ? logs : allLogs} />
                </ChartCard>
              </>
            )}

            {/* By Type + By Status */}
            {ideas.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title="Ideas By Type" subtitle="distribution across categories">
                  <IdeasByTypeChart ideas={ideas} />
                </ChartCard>
                <ChartCard title="Ideas By Status" subtitle="pipeline stage breakdown">
                  <IdeasByStatusChart ideas={ideas} />
                </ChartCard>
              </div>
            )}

            {/* Top Sectors + Grade Distribution */}
            {ideas.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title="Top Sectors" subtitle="where your ideas cluster">
                  <TopSectorsChart ideas={ideas} />
                </ChartCard>
                <ChartCard title="Grade Distribution" subtitle="quality spread">
                  <GradeDistributionChart ideas={ideas} />
                </ChartCard>
              </div>
            )}

            {/* Insights */}
            {ideas.length > 0 && insights.length > 0 && (
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
                <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest mb-4">
                  <span className="text-[#F7C948] mr-2">✦</span>
                  Insights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-[#0D0D18] rounded-xl px-4 py-3">
                      <span className="w-1 h-1 rounded-full bg-[#F7C948]/60 shrink-0 mt-1.5" />
                      <p className="text-[11px] text-[#6A6A80] leading-snug capitalize">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

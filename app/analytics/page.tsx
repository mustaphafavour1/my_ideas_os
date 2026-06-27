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
} from '@/components/analytics/Charts';
import { createServiceClient } from '@/lib/supabase';
import { Idea } from '@/lib/types';

async function getData(): Promise<{ ideas: Idea[]; syncCount: number }> {
  const supabase = createServiceClient();
  const [{ data: ideas }, { count: syncCount }] = await Promise.all([
    supabase.from('ideas').select('*').eq('user_id', 'favour'),
    supabase.from('sync_log').select('*', { count: 'exact', head: true }).eq('user_id', 'favour'),
  ]);
  return { ideas: (ideas || []) as Idea[], syncCount: syncCount || 0 };
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

  // Group by type + status combos
  const typeCounts: Record<string, { completed: number; inProgress: number; total: number; blocked: number }> = {};
  ideas.forEach((i) => {
    const type = i.idea_type || 'untyped';
    if (!typeCounts[type]) typeCounts[type] = { completed: 0, inProgress: 0, total: 0, blocked: 0 };
    typeCounts[type].total++;
    if (i.status === 'completed') typeCounts[type].completed++;
    if (i.status === 'in_progress') typeCounts[type].inProgress++;
    if (i.blockers && i.blockers.length > 0) typeCounts[type].blocked++;
  });

  const sorted = Object.entries(typeCounts).sort((a, b) => b[1].total - a[1].total);

  sorted.slice(0, 4).forEach(([type, counts]) => {
    const label = type.replace(/_/g, ' ');
    if (counts.completed > 0) {
      insights.push(`${counts.completed} ${label} idea${counts.completed !== 1 ? 's' : ''} completed`);
    }
    if (counts.inProgress > 0) {
      insights.push(`${counts.inProgress} ${label} idea${counts.inProgress !== 1 ? 's' : ''} in progress`);
    }
    if (counts.blocked > 0) {
      insights.push(`${counts.blocked} ${label} idea${counts.blocked !== 1 ? 's' : ''} ${counts.blocked !== 1 ? 'have' : 'has'} blockers`);
    }
  });

  // Paused ideas
  const paused = ideas.filter((i) => i.status === 'paused').length;
  if (paused > 0) insights.push(`${paused} idea${paused !== 1 ? 's' : ''} currently paused`);

  return insights.slice(0, 6);
}

function avgDaysBetweenChats(ideas: Idea[]): string {
  const withDates = ideas.filter((i) => i.chat_date && i.updated_at);
  if (withDates.length === 0) return '—';
  const diffs = withDates.map((i) => {
    const first = new Date(i.chat_date!).getTime();
    const last = new Date(i.updated_at).getTime();
    return Math.abs(last - first) / (1000 * 60 * 60 * 24);
  });
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return avg < 1 ? '<1' : Math.round(avg).toString();
}

export default async function AnalyticsPage() {
  const { ideas, syncCount } = await getData();

  const inProgress = ideas.filter(i => i.status === 'in_progress').length;
  const completed = ideas.filter(i => i.status === 'completed').length;
  const avgDays = avgDaysBetweenChats(ideas);
  const insights = buildInsights(ideas);

  const metricCards = [
    { label: 'Total Ideas', value: ideas.length },
    { label: 'In Progress', value: inProgress },
    { label: 'Completed', value: completed },
    { label: 'Syncs Done', value: syncCount },
    { label: 'Avg Days / Idea', value: avgDays },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Analytics" subtitle={`${ideas.length} ideas · ${inProgress} active · ${completed} shipped`} />

      <main className="flex-1 px-4 lg:px-8 py-8 max-w-6xl mx-auto w-full">
        {ideas.length === 0 ? (
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center">
            <p className="text-[12px] text-[#3A3A55] font-mono">No data yet — sync your ideas to see analytics</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Metric summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {metricCards.map(({ label, value }) => (
                <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
                  <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                  <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
                </div>
              ))}
            </div>

            {/* Row 1 — completion + avg grade + timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-[200px_200px_1fr] gap-5">
              <ChartCard title="Completion" tall>
                <CompletionRing ideas={ideas} />
              </ChartCard>
              <ChartCard title="Avg Grade" tall>
                <AvgGradeRing ideas={ideas} />
              </ChartCard>
              <ChartCard title="Ideas Over Time" subtitle="captured per month">
                <IdeasTimelineChart ideas={ideas} />
              </ChartCard>
            </div>

            {/* Row 2 — type + status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="By Type" subtitle="distribution across categories">
                <IdeasByTypeChart ideas={ideas} />
              </ChartCard>
              <ChartCard title="By Status" subtitle="pipeline stage breakdown">
                <IdeasByStatusChart ideas={ideas} />
              </ChartCard>
            </div>

            {/* Row 3 — sectors + grade dist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Top Sectors" subtitle="where your ideas cluster">
                <TopSectorsChart ideas={ideas} />
              </ChartCard>
              <ChartCard title="Grade Distribution" subtitle="quality spread">
                <GradeDistributionChart ideas={ideas} />
              </ChartCard>
            </div>

            {/* Combined insights */}
            {insights.length > 0 && (
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

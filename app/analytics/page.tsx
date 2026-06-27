export const dynamic = 'force-dynamic';

import { TopBar } from '@/components/layout/TopBar';
import {
  IdeasByTypeChart,
  IdeasByStatusChart,
  GradeDistributionChart,
  IdeasTimelineChart,
  CompletionRing,
  TopSectorsChart,
} from '@/components/analytics/Charts';
import { createServiceClient } from '@/lib/supabase';
import { Idea } from '@/lib/types';

async function getIdeas(): Promise<Idea[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', 'favour');
  return (data || []) as Idea[];
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

export default async function AnalyticsPage() {
  const ideas = await getIdeas();

  const inProgress = ideas.filter(i => i.status === 'in_progress').length;
  const completed = ideas.filter(i => i.status === 'completed').length;
  const avgGrade = ideas.length > 0
    ? (ideas.reduce((s, i) => s + (i.grade_overall ?? 0), 0) / ideas.filter(i => i.grade_overall).length).toFixed(1)
    : '—';

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
            {/* Row 1 — completion + timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
              <ChartCard title="Completion" subtitle={`Avg grade ${avgGrade}`} tall>
                <CompletionRing ideas={ideas} />
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
          </div>
        )}
      </main>
    </div>
  );
}

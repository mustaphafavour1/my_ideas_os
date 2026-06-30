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
import { DEMO_IDEAS, DEMO_CONVERSATIONS_LOG, DEMO_USER_STATS } from '@/lib/demo-data';
import { Idea, ConversationLog } from '@/lib/types';

const ideas = DEMO_IDEAS as unknown as Idea[];
const logs = DEMO_CONVERSATIONS_LOG as unknown as ConversationLog[];

function ChartCard({ title, subtitle, children, tall }: { title: string; subtitle?: string; children: React.ReactNode; tall?: boolean }) {
  return (
    <div className={`bg-[#111118] border border-[#1E1E2E] rounded-xl flex flex-col ${tall ? 'h-full' : ''}`}>
      <div className="px-6 pt-6 pb-4 border-b border-[#1A1A28]">
        <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">{title}</h3>
        {subtitle && <p className="text-[11px] text-[#3A3A55] mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6 flex-1">{children}</div>
    </div>
  );
}

export default function DemoAnalyticsPage() {
  const inProgress = ideas.filter((i) => i.status === 'in_progress').length;
  const completed = ideas.filter((i) => i.status === 'completed').length;

  const metricCards = [
    { label: 'Total Ideas', value: ideas.length },
    { label: 'In Progress', value: inProgress },
    { label: 'Completed', value: completed },
    { label: 'Total Convos', value: logs.length },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Analytics"
        subtitle={`${ideas.length} ideas · ${inProgress} active · ${completed} shipped`}
      />
      <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-6xl mx-auto w-full">
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metricCards.map(({ label, value }) => (
              <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
                <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
              </div>
            ))}
          </div>

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

          <ChartCard title="Conversations Over Time" subtitle="messages per month">
            <ConversationsTimelineChart logs={logs} />
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Ideas By Type" subtitle="distribution across categories">
              <IdeasByTypeChart ideas={ideas} />
            </ChartCard>
            <ChartCard title="Ideas By Status" subtitle="pipeline stage breakdown">
              <IdeasByStatusChart ideas={ideas} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Top Sectors" subtitle="where your ideas cluster">
              <TopSectorsChart ideas={ideas} />
            </ChartCard>
            <ChartCard title="Grade Distribution" subtitle="quality spread">
              <GradeDistributionChart ideas={ideas} />
            </ChartCard>
          </div>
        </div>
      </main>
    </div>
  );
}

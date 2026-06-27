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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
      <h3 className="text-sm font-semibold text-[#F0F0F5] mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default async function AnalyticsPage() {
  const ideas = await getIdeas();

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Analytics" subtitle={`${ideas.length} ideas analysed`} />

      <main className="flex-1 px-4 lg:px-8 py-6 max-w-6xl mx-auto w-full space-y-6">
        {ideas.length === 0 ? (
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-12 text-center">
            <p className="text-[#4A4A60] text-sm">No data yet — sync your ideas to see analytics</p>
          </div>
        ) : (
          <>
            {/* Top row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title="Completion Rate">
                <CompletionRing ideas={ideas} />
              </ChartCard>
              <div className="lg:col-span-2">
                <ChartCard title="Ideas by Type">
                  <IdeasByTypeChart ideas={ideas} />
                </ChartCard>
              </div>
            </div>

            {/* Middle row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Ideas by Status">
                <IdeasByStatusChart ideas={ideas} />
              </ChartCard>
              <ChartCard title="Grade Distribution">
                <GradeDistributionChart ideas={ideas} />
              </ChartCard>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Top Sectors">
                <TopSectorsChart ideas={ideas} />
              </ChartCard>
              <ChartCard title="Ideas Captured per Month">
                <IdeasTimelineChart ideas={ideas} />
              </ChartCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

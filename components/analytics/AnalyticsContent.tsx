'use client';

import { useState } from 'react';
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
import { Idea, ConversationLog } from '@/lib/types';

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

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-[#111118] border border-[#1E1E2E] rounded-xl animate-pulse ${className}`} />;
}

interface MetricCard {
  label: string;
  value: string | number;
}

interface Props {
  range: string;
  from?: string;
  to?: string;
  ideas: Idea[];
  allIdeasCount: number;
  logs: ConversationLog[];
  allLogs: ConversationLog[];
  inProgress: number;
  completed: number;
  insights: string[];
  metricCards: MetricCard[];
  convMetricCards: MetricCard[] | null;
}

export function AnalyticsContent({
  range, from, to, ideas, allIdeasCount, logs, allLogs,
  inProgress, completed, insights, metricCards, convMetricCards,
}: Props) {
  const [isPending, setIsPending] = useState(false);

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Analytics" subtitle={`${ideas.length} ideas · ${inProgress} active · ${completed} shipped`} />

      <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-6xl mx-auto w-full">
        {/* Time range filter */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <TimeRangeFilter currentRange={range} currentFrom={from} currentTo={to} onPendingChange={setIsPending} />
          {range !== 'all' && !isPending && (
            <p className="text-[10px] font-mono text-[#3A3A55]">
              {ideas.length} of {allIdeasCount} ideas
            </p>
          )}
        </div>

        {isPending ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-[76px]" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[200px_200px_1fr] gap-5">
              <SkeletonBlock className="h-[240px]" />
              <SkeletonBlock className="h-[240px]" />
              <SkeletonBlock className="h-[240px]" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-[76px]" />)}
            </div>
            <SkeletonBlock className="h-[260px]" />
          </div>
        ) : ideas.length === 0 && logs.length === 0 ? (
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
                <ChartCard title="Ideas Over Time" subtitle="captured per month (per year if the range spans multiple years)">
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

                <ChartCard title="Conversations Over Time" subtitle="messages per month (per year if the range spans multiple years)">
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

'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { IdeaTable } from '@/components/ideas/IdeaTable';
import { TimeRangeFilter } from '@/components/ui/TimeRangeFilter';
import { DEMO_IDEAS } from '@/lib/demo-data';
import { Idea } from '@/lib/types';
import { getRangeCutoff, ideaDate } from '@/lib/dashboard-utils';

const allIdeas = DEMO_IDEAS as unknown as Idea[];

function DemoIdeasPageInner() {
  const searchParams = useSearchParams();
  const range = searchParams.get('range') || 'all';
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const offset = searchParams.get('offset') || undefined;

  const ideas = useMemo(() => {
    const cutoff = getRangeCutoff(range, from, to, offset);
    if (!cutoff.from && !cutoff.to) return allIdeas;
    return allIdeas.filter((i) => {
      const d = new Date(ideaDate(i));
      if (cutoff.from && d < cutoff.from) return false;
      if (cutoff.to && d > cutoff.to) return false;
      return true;
    });
  }, [range, from, to, offset]);

  const inProgress = ideas.filter((i) => i.status === 'in_progress').length;
  const completed = ideas.filter((i) => i.status === 'completed').length;
  const graded = ideas.filter((i) => i.grade_overall !== null);
  const avgGrade = graded.length > 0
    ? (graded.reduce((s, i) => s + (i.grade_overall ?? 0), 0) / graded.length).toFixed(1)
    : '—';

  const metricCards = [
    { label: 'Total Ideas', value: ideas.length },
    { label: 'In Progress', value: inProgress },
    { label: 'Completed', value: completed },
    { label: 'Avg Grade', value: avgGrade },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Ideas" />

      <main className="flex-1 px-4 lg:px-8 pt-10 pb-6 max-w-6xl mx-auto w-full">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#E8E8F0] leading-none">{ideas.length}</h2>
            <p className="text-[11px] font-mono text-[#3A3A55] mt-1">
              {`idea${ideas.length !== 1 ? 's' : ''} ${range !== 'all' ? 'in range' : 'total'} · demo data`}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <TimeRangeFilter currentRange={range} currentFrom={from} currentTo={to} currentOffset={offset} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {metricCards.map(({ label, value }) => (
            <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
              <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
              <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
            </div>
          ))}
        </div>

        <IdeaTable ideas={ideas} baseUrl="/demo/ideas" isDemo />
      </main>
    </div>
  );
}

export default function DemoIdeasPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1">
        <TopBar title="Ideas" />
      </div>
    }>
      <DemoIdeasPageInner />
    </Suspense>
  );
}

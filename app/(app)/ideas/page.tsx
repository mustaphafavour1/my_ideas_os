'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { IdeaTable } from '@/components/ideas/IdeaTable';
import { AddIdeaForm } from '@/components/ideas/AddIdeaForm';
import { Modal } from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { TimeRangeFilter } from '@/components/ui/TimeRangeFilter';
import { Idea } from '@/lib/types';
import { getRangeCutoff, ideaDate } from '@/lib/dashboard-utils';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-[#111118] border border-[#1E1E2E] rounded-xl animate-pulse ${className}`} />;
}

function IdeasPageInner() {
  const searchParams = useSearchParams();
  const range = searchParams.get('range') || 'all';
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const offset = searchParams.get('offset') || undefined;

  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPending, setFilterPending] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ideas');
      const data = await res.json();
      setAllIdeas(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = () => { fetchIdeas(); };
    run();
  }, [fetchIdeas]);

  const ideas = useMemo(() => {
    const cutoff = getRangeCutoff(range, from, to, offset);
    if (!cutoff.from && !cutoff.to) return allIdeas;
    return allIdeas.filter((i) => {
      const d = new Date(ideaDate(i));
      if (cutoff.from && d < cutoff.from) return false;
      if (cutoff.to && d > cutoff.to) return false;
      return true;
    });
  }, [allIdeas, range, from, to, offset]);

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
        {/* Count header outside TopBar */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#E8E8F0] leading-none">
              {loading ? '—' : ideas.length}
            </h2>
            <p className="text-[11px] font-mono text-[#3A3A55] mt-1">
              {loading ? 'Loading…' : `idea${ideas.length !== 1 ? 's' : ''} ${range !== 'all' ? 'in range' : 'total'}`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#F7C948] text-[#0A0A0F] text-[12px] font-semibold rounded-lg hover:bg-[#E6B830] transition-colors"
          >
            + New Idea
          </button>
        </div>

        <div className="mb-4">
          <TimeRangeFilter currentRange={range} currentFrom={from} currentTo={to} currentOffset={offset} onPendingChange={setFilterPending} />
        </div>

        {(loading || filterPending) ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-[76px]" />)}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {metricCards.map(({ label, value }) => (
                  <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
                    <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                    <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
                  </div>
                ))}
              </div>

              <IdeaTable ideas={ideas} />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Idea" width="md">
        <AddIdeaForm
          onSuccess={() => { setShowAdd(false); fetchIdeas(); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  );
}

export default function IdeasPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1">
        <TopBar title="Ideas" />
        <main className="flex-1 px-4 lg:px-8 pt-10 pb-6 max-w-6xl mx-auto w-full">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)}
          </div>
        </main>
      </div>
    }>
      <IdeasPageInner />
    </Suspense>
  );
}

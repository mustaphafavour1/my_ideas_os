'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Idea } from '@/lib/types';
import Link from 'next/link';
import { toast } from 'sonner';

const ACTIVE_STATUSES = ['captured', 'lightly_researched', 'prototyping', 'validated', 'in_progress', 'paused'];

export default function SuggestionsPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ideas');
      const data: Idea[] = await res.json();
      const active = data.filter((i) => ACTIVE_STATUSES.includes(i.status));
      setIdeas(active);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ideas;
    const q = search.toLowerCase();
    return ideas.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      (i.ai_suggestions || '').toLowerCase().includes(q) ||
      (i.sector || '').toLowerCase().includes(q)
    );
  }, [ideas, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideas: ideas.slice(0, 10).map(i => ({
            id: i.id, title: i.title, description: i.description,
            status: i.status, sector: i.sector, idea_type: i.idea_type,
            next_steps: i.next_steps, blockers: i.blockers,
          })),
        }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      const { updated } = await res.json();
      toast.success(`${updated} suggestions refreshed`);
      await fetchIdeas();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkDone = async (id: string) => {
    await fetch(`/api/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    toast.success('Marked as completed');
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Suggestions" subtitle="AI-powered next moves" />

      <main className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Controls */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suggestions…"
              className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-3 py-2 text-[12px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3A3A55]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {search && (
            <span className="text-[10px] font-mono text-[#3A3A55]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          )}
          <div className="ml-auto">
            <Button size="sm" variant="secondary" loading={refreshing} onClick={handleRefresh}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4">
              {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center"
            >
              <p className="text-[12px] text-[#3A3A55] font-mono mb-2">
                {search ? 'No results for that search' : 'No active ideas found'}
              </p>
              <p className="text-[11px] text-[#2A2A40] font-mono">
                {search ? 'Try a different search term' : 'Add or sync ideas to see AI suggestions here'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {filtered.map((idea, i) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 card-glow hover:border-[#252535] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-semibold text-[#E0E0EA] mb-2">{idea.title}</h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {idea.idea_type && <Badge type={idea.idea_type} size="sm" />}
                        <StatusChip status={idea.status} size="sm" />
                        {idea.sector && (
                          <span className="text-[10px] font-mono text-[#3A3A55] capitalize">{idea.sector}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {idea.ai_suggestions ? (
                    <div className="flex gap-2.5 mb-4 bg-[#F7C948]/5 border border-[#F7C948]/12 rounded-xl p-4">
                      <span className="text-[#F7C948] shrink-0 text-[11px] mt-0.5">✦</span>
                      <p className="text-[12px] text-[#7A7A90] leading-relaxed">{idea.ai_suggestions}</p>
                    </div>
                  ) : (
                    <div className="mb-4 bg-[#0D0D18] rounded-xl p-4">
                      <p className="text-[11px] text-[#3A3A55] font-mono">No suggestion yet — click Refresh to generate one</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/ideas/${idea.id}`}>
                      <Button size="sm" variant="secondary">View Idea</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => handleMarkDone(idea.id)}>
                      Mark Done ✓
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Idea, IdeaStatus } from '@/lib/types';
import Link from 'next/link';
import { toast } from 'sonner';

const ACTIVE_STATUSES: IdeaStatus[] = ['captured', 'lightly_researched', 'prototyping', 'validated', 'in_progress', 'paused'];
const PAGE_SIZE = 7;

type SortMode = 'recent_suggestion' | 'recent_idea' | 'alphabetical';

export default function SuggestionsPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | ''>('');
  const [sortMode, setSortMode] = useState<SortMode>('recent_suggestion');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ideas');
      const data: Idea[] = await res.json();
      const active = data.filter((i) => ACTIVE_STATUSES.includes(i.status as IdeaStatus));
      setIdeas(active);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter, sortMode]);

  const filtered = useMemo(() => {
    let result = ideas;

    if (statusFilter) result = result.filter((i) => i.status === statusFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        (i.ai_suggestions || '').toLowerCase().includes(q) ||
        (i.sector || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortMode === 'alphabetical') return a.title.localeCompare(b.title);
      if (sortMode === 'recent_idea') {
        const ad = a.chat_date || a.created_at;
        const bd = b.chat_date || b.created_at;
        return new Date(bd).getTime() - new Date(ad).getTime();
      }
      // recent_suggestion: ideas with suggestions first, then by updated_at
      const aHas = a.ai_suggestions ? 1 : 0;
      const bHas = b.ai_suggestions ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [ideas, search, statusFilter, sortMode]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Suggestions" subtitle="AI-powered next moves" />

      <main className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
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

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | '')}
            className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-[12px] text-[#5E5E7A] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
          >
            <option value="">All statuses</option>
            {ACTIVE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-[12px] text-[#5E5E7A] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
          >
            <option value="recent_suggestion">Recent suggestions</option>
            <option value="recent_idea">Recently added ideas</option>
            <option value="alphabetical">Alphabetical</option>
          </select>

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
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
            </motion.div>
          ) : paginated.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center"
            >
              <p className="text-[12px] text-[#3A3A55] font-mono mb-2">
                {search || statusFilter ? 'No results for those filters' : 'No active ideas found'}
              </p>
              <p className="text-[11px] text-[#2A2A40] font-mono">
                {search || statusFilter ? 'Try adjusting your filters' : 'Add or sync ideas to see AI suggestions here'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-9">
              {paginated.map((idea, i) => {
                const isExpanded = expanded.has(idea.id);
                return (
                  <motion.div
                    key={idea.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 card-glow hover:border-[#252535] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-semibold text-[#E0E0EA] mb-2">{idea.title}</h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {idea.idea_type && <Badge type={idea.idea_type} size="sm" />}
                          <StatusChip status={idea.status} size="sm" />
                          {idea.sector && (
                            <span className="text-[10px] font-mono text-[#3A3A55] capitalize">{idea.sector}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Primary suggestion */}
                    {idea.ai_suggestions ? (
                      <div className="flex gap-2.5 mb-3 bg-[#F7C948]/5 border border-[#F7C948]/12 rounded-xl p-4">
                        <span className="text-[#F7C948] shrink-0 text-[11px] mt-0.5">✦</span>
                        <p className="text-[12px] text-[#7A7A90] leading-relaxed">{idea.ai_suggestions}</p>
                      </div>
                    ) : (
                      <div className="mb-3 bg-[#0D0D18] rounded-xl p-4">
                        <p className="text-[11px] text-[#3A3A55] font-mono">No suggestion yet — click Refresh to generate one</p>
                      </div>
                    )}

                    {/* View more toggle */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 mb-3 pt-1">
                            {/* Description */}
                            {idea.description && (
                              <div className="bg-[#0D0D18] rounded-xl p-4">
                                <p className="text-[10px] font-mono text-[#3A3A55] uppercase tracking-widest mb-2">Description</p>
                                <p className="text-[12px] text-[#6A6A80] leading-relaxed">{idea.description}</p>
                              </div>
                            )}
                            {/* Next steps */}
                            {idea.next_steps && idea.next_steps.length > 0 && (
                              <div className="bg-[#0D0D18] rounded-xl p-4">
                                <p className="text-[10px] font-mono text-[#3A3A55] uppercase tracking-widest mb-2">Next Steps</p>
                                <ul className="space-y-1">
                                  {idea.next_steps.map((s, idx) => (
                                    <li key={idx} className="flex gap-2 text-[11px] text-[#6A6A80]">
                                      <span className="text-[#4A4A60] shrink-0">{idx + 1}.</span>
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {/* Blockers */}
                            {idea.blockers && idea.blockers.length > 0 && (
                              <div className="bg-[#0D0D18] rounded-xl p-4">
                                <p className="text-[10px] font-mono text-[#3A3A55] uppercase tracking-widest mb-2">Blockers</p>
                                <ul className="space-y-1">
                                  {idea.blockers.map((b, idx) => (
                                    <li key={idx} className="flex gap-2 text-[11px] text-[#C06830]">
                                      <span className="shrink-0">●</span>
                                      <span className="text-[#6A6A80]">{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-2 items-center">
                      <Link href={`/ideas/${idea.id}`}>
                        <Button size="sm" variant="secondary">View Idea</Button>
                      </Link>
                      <button
                        onClick={() => toggleExpand(idea.id)}
                        className="text-[10px] font-mono text-[#3A3A55] hover:text-[#6A6A80] transition-colors px-2 py-1"
                      >
                        {isExpanded ? 'Less ↑' : 'More ↓'}
                      </button>
                      <Button size="sm" variant="ghost" onClick={() => handleMarkDone(idea.id)} className="ml-auto">
                        Mark Done ✓
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1E1E2E] text-[#4A4A60] hover:border-[#2A2A3A] hover:text-[#8888A0] disabled:opacity-30 transition-colors text-[12px]"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-mono transition-colors ${
                  p === page
                    ? 'bg-[#F7C948] text-[#0A0A0F] font-semibold'
                    : 'border border-[#1E1E2E] text-[#4A4A60] hover:border-[#2A2A3A] hover:text-[#8888A0]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1E1E2E] text-[#4A4A60] hover:border-[#2A2A3A] hover:text-[#8888A0] disabled:opacity-30 transition-colors text-[12px]"
            >
              →
            </button>
            <span className="text-[10px] font-mono text-[#3A3A55] ml-2">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

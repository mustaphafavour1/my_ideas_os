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

interface ConnectedPair {
  a: Idea;
  b: Idea;
  score: number;
  reasons: string[];
  recommendations: string[];
}

function findConnectedPairs(ideas: Idea[]): ConnectedPair[] {
  const pairs: ConnectedPair[] = [];
  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const a = ideas[i];
      const b = ideas[j];
      let score = 0;
      const reasons: string[] = [];
      const recommendations: string[] = [];

      if (a.sector && b.sector && a.sector === b.sector) {
        score += 3;
        reasons.push(`${a.sector} sector`);
        recommendations.push(`Both tackle the ${a.sector} space — parallel development lets you share market positioning and distribution.`);
      }
      if (a.idea_type && b.idea_type && a.idea_type === b.idea_type) {
        score += 2;
        const typeLabel = a.idea_type.replace(/_/g, ' ');
        reasons.push(typeLabel);
        recommendations.push(`Same format (${typeLabel}) — infrastructure, playbooks, and learnings transfer directly between these.`);
      }

      const aWords = new Set(
        a.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      );
      const bWords = new Set(
        b.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      );
      let overlap = 0;
      for (const w of aWords) {
        if (bWords.has(w)) overlap++;
      }
      if (overlap > 0) {
        score += overlap;
        reasons.push(`${overlap} shared word${overlap > 1 ? 's' : ''}`);
        recommendations.push(`Shared core concept — decide deliberately whether to merge these into one idea or keep them separate with clear differentiation.`);
      }

      if (score >= 5) {
        recommendations.push(`Strong synergy (score ${score}) — consider launching as a bundled offer or a single product with two distinct modes.`);
      }

      if (score >= 3) pairs.push({ a, b, score, reasons, recommendations });
    }
  }
  return pairs.sort((x, y) => y.score - x.score).slice(0, 8);
}

export default function InsightsPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | ''>('');
  const [sortMode, setSortMode] = useState<SortMode>('recent_suggestion');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showConnected, setShowConnected] = useState(true);
  const [selectedPair, setSelectedPair] = useState<ConnectedPair | null>(null);

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
  useEffect(() => { setPage(1); }, [search, statusFilter, sortMode]);

  const connectedPairs = useMemo(() => findConnectedPairs(ideas), [ideas]);

  const filtered = useMemo(() => {
    let result = ideas;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
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
          ideas: ideas.slice(0, 10).map((i) => ({
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
      <TopBar title="Insights" subtitle="AI suggestions & connected ideas" />

      <main className="flex-1 px-4 lg:px-8 py-8 max-w-4xl mx-auto w-full space-y-8">

        {/* Connected Ideas section */}
        {!loading && connectedPairs.length > 0 && (
          <section>
            <button
              onClick={() => setShowConnected((v) => !v)}
              className="flex items-center gap-2 mb-4 group"
            >
              <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest group-hover:text-[#6A6A80] transition-colors">
                Connected Ideas
              </h2>
              <span className="text-[9px] font-mono text-[#2A2A40]">({connectedPairs.length})</span>
              <span className="text-[10px] text-[#2A2A40] group-hover:text-[#4A4A60] transition-colors">
                {showConnected ? '↑' : '↓'}
              </span>
            </button>

            <AnimatePresence>
              {showConnected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {connectedPairs.map((pair, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPair(pair)}
                        className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 hover:border-[#252535] hover:bg-[#13131F] transition-colors text-left w-full"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <p className="text-[12px] text-[#D0D0DA] font-medium hover:text-[#F7C948] transition-colors truncate">
                              {pair.a.title}
                            </p>
                            <div className="w-4 h-px bg-[#2A2A3A]" />
                            <p className="text-[12px] text-[#D0D0DA] font-medium hover:text-[#F7C948] transition-colors truncate">
                              {pair.b.title}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[13px] font-bold text-[#F7C948]">{pair.score}</p>
                            <p className="text-[9px] font-mono text-[#3A3A55]">score</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {pair.reasons.map((r, i) => (
                            <span key={i} className="text-[9px] font-mono text-[#4A4A60] bg-[#1A1A28] px-2 py-0.5 rounded">
                              {r}
                            </span>
                          ))}
                        </div>
                        <p className="mt-3 text-[9px] font-mono text-[#3A3A55] hover:text-[#6A6A80] transition-colors">
                          Click to view details →
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Connected pair modal */}
                  <AnimatePresence>
                    {selectedPair && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.7)' }}
                        onClick={() => setSelectedPair(null)}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: 8 }}
                          transition={{ duration: 0.18 }}
                          className="bg-[#111118] border border-[#252535] rounded-2xl p-7 max-w-lg w-full shadow-2xl relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedPair(null)}
                            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-[#4A4A60] hover:text-white/60 hover:bg-white/5 transition-colors text-[14px]"
                          >
                            ✕
                          </button>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                              <p className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-2">Connected Ideas</p>
                              <div className="space-y-2">
                                <Link
                                  href={`/ideas/${selectedPair.a.id}`}
                                  className="block text-[14px] text-[#D0D0DA] font-semibold hover:text-[#F7C948] transition-colors leading-snug"
                                  onClick={() => setSelectedPair(null)}
                                >
                                  {selectedPair.a.title}
                                </Link>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-px bg-[#2A2A3A]" />
                                  <span className="text-[9px] font-mono text-[#3A3A55]">connected</span>
                                  <div className="flex-1 h-px bg-[#2A2A3A]" />
                                </div>
                                <Link
                                  href={`/ideas/${selectedPair.b.id}`}
                                  className="block text-[14px] text-[#D0D0DA] font-semibold hover:text-[#F7C948] transition-colors leading-snug"
                                  onClick={() => setSelectedPair(null)}
                                >
                                  {selectedPair.b.title}
                                </Link>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[24px] font-bold text-[#F7C948] leading-none">
                                {selectedPair.score}
                                <span className="text-[13px] font-normal text-white/30">/10</span>
                              </p>
                              <p className="text-[9px] font-mono text-white/30">connection score</p>
                            </div>
                          </div>

                          {/* Why connected */}
                          <div className="mb-5">
                            <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-2">Why connected</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedPair.reasons.map((r, i) => (
                                <span key={i} className="text-[10px] font-mono text-[#5E5E7A] bg-[#1A1A28] px-2.5 py-1 rounded-lg">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div className="mb-6">
                            <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-3">What to do with this connection</p>
                            <div className="space-y-3">
                              {selectedPair.recommendations.map((rec, i) => (
                                <div key={i} className="flex gap-2.5 items-start bg-[#0D0D18] rounded-xl px-4 py-3">
                                  <span className="text-[#F7C948]/60 shrink-0 text-[11px] mt-0.5">✦</span>
                                  <p className="text-[12px] text-[#7A7A90] leading-relaxed">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedPair(null)}
                            className="w-full py-2.5 rounded-xl border border-[#1E1E2E] text-[11px] font-mono text-[#4A4A60] hover:border-[#2A2A3A] hover:text-[#6A6A80] transition-colors"
                          >
                            Close
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
              placeholder="Search… press Enter"
              className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-3 py-2 text-[12px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3A3A55]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | '')}
            className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-[12px] text-[#5E5E7A] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
          >
            <option value="">All statuses</option>
            {ACTIVE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>

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
            <button
              onClick={() => { setSearchInput(''); setSearch(''); }}
              className="text-[10px] font-mono text-[#3A3A55] hover:text-[#6A6A80]"
            >
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} · clear ×
            </button>
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

        {/* Suggestions list */}
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

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 mb-3 pt-1">
                            {idea.description && (
                              <div className="bg-[#0D0D18] rounded-xl p-4">
                                <p className="text-[10px] font-mono text-[#3A3A55] uppercase tracking-widest mb-2">Description</p>
                                <p className="text-[12px] text-[#6A6A80] leading-relaxed">{idea.description}</p>
                              </div>
                            )}
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

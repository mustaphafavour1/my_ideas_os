'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { StatusChip } from '@/components/ui/StatusChip';
import { AskBox } from '@/components/dashboard/AskBox';
import { Idea, DashboardStats } from '@/lib/types';

const SETTINGS_KEY = 'ideas-os-settings';

type SectionId = 'stats' | 'recentIdeas' | 'askAI' | 'attention';

interface SectionVisibility {
  showStats: boolean;
  showRecentIdeas: boolean;
  showAskAI: boolean;
  showNeedsAttention: boolean;
  showAISuggestions: boolean;
  order: SectionId[];
}

const DEFAULT_VIS: SectionVisibility = {
  showStats: true,
  showRecentIdeas: true,
  showAskAI: true,
  showNeedsAttention: true,
  showAISuggestions: true,
  order: ['stats', 'recentIdeas', 'askAI', 'attention'],
};

export interface DashboardContentProps {
  stats: DashboardStats;
  recent: Idea[];
  needsAttention: Idea[];
  withSuggestions: Idea[];
  unprocessedCount: number;
  withBlockers: number;
  paused: number;
  topSector: string | null;
  topSectorCount: number;
  topType: string | null;
  topTypeCount: number;
  completionPct: number;
  mostPausedSector: string | null;
  mostPausedCount: number;
  mostCompletedType: string | null;
  mostCompletedCount: number;
  mostBlockersType: string | null;
  mostBlockersCount: number;
}

function SectionLabel({ label, href, linkText }: { label: string; href?: string; linkText?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">{label}</h2>
      {href && linkText && (
        <Link href={href} className="text-[10px] font-mono text-[#3A3A55] hover:text-[#F7C948] transition-colors">
          {linkText} →
        </Link>
      )}
    </div>
  );
}

export function DashboardContent({
  stats, recent, needsAttention, withSuggestions, unprocessedCount,
  withBlockers, paused, topSector, topSectorCount, topType, topTypeCount, completionPct,
  mostPausedSector, mostPausedCount, mostCompletedType, mostCompletedCount, mostBlockersType, mostBlockersCount,
}: DashboardContentProps) {
  const [vis, setVis] = useState<SectionVisibility>(DEFAULT_VIS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.dashboard) {
          const loadedOrder = parsed.dashboard.order;
          setVis((v) => ({
            ...v,
            ...parsed.dashboard,
            order: Array.isArray(loadedOrder) && loadedOrder.length > 0 ? loadedOrder : DEFAULT_VIS.order,
          }));
        }
      }
    } catch {}
  }, []);

  const primaryMetrics = [
    { label: 'Total Ideas',   value: stats.total,                                              sub: 'all time',        accent: false,                  danger: false },
    { label: 'In Progress',   value: stats.in_progress,                                        sub: 'active now',      accent: true,                   danger: false },
    { label: 'Completed',     value: stats.completed,                                          sub: 'shipped',         accent: false,                  danger: false },
    { label: 'Avg Grade',     value: stats.avg_grade > 0 ? stats.avg_grade.toFixed(1) : '—',  sub: 'across ideas',    accent: stats.avg_grade >= 3.5, danger: false },
    { label: 'With Blockers', value: withBlockers,                                             sub: 'need unblocking', accent: withBlockers > 0,       danger: withBlockers > 0 },
    { label: 'Paused',        value: paused,                                                   sub: 'on hold',         accent: false,                  danger: false },
  ];

  const secondaryMetrics = [
    topType          ? { label: 'Top Category',     main: topType.replace(/_/g, ' '),          count: topTypeCount }     : null,
    topSector        ? { label: 'Top Sector',        main: topSector,                           count: topSectorCount }   : null,
    { label: 'Completion',       main: `${completionPct}%`,                              count: null },
    mostPausedSector ? { label: 'Most Paused',       main: mostPausedSector,                    count: mostPausedCount }  : null,
    mostCompletedType? { label: 'Most Completed',    main: mostCompletedType.replace(/_/g, ' '), count: mostCompletedCount } : null,
    mostBlockersType ? { label: 'Most Blocked',      main: mostBlockersType.replace(/_/g, ' '),  count: mostBlockersCount } : null,
  ].filter(Boolean) as { label: string; main: string; count: number | null }[];

  const showNeeds = vis.showNeedsAttention && needsAttention.length > 0;
  const showSugg = vis.showAISuggestions && withSuggestions.length > 0;

  const renderSection = (id: SectionId) => {
    if (id === 'stats') {
      if (!vis.showStats) return null;
      return (
        <section key="stats">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {primaryMetrics.map(({ label, value, sub, accent, danger }) => (
              <div
                key={label}
                className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 relative overflow-hidden card-glow"
              >
                <div
                  className="absolute inset-x-0 top-0 h-[1px]"
                  style={{
                    background: accent
                      ? 'linear-gradient(90deg, transparent, rgba(247,201,72,0.3), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                  }}
                />
                <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-3">{label}</p>
                <p className={`text-[26px] font-bold leading-none mb-1.5 tracking-tight ${danger ? 'text-[#C06830]' : accent ? 'text-[#F7C948]' : 'text-[#E8E8F0]'}`}>
                  {value}
                </p>
                {sub && <p className="text-[10px] text-[#3A3A55] font-mono">{sub}</p>}
              </div>
            ))}
          </div>

          {secondaryMetrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
              {secondaryMetrics.map(({ label, main, count }) => (
                <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
                  <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-[15px] font-semibold text-[#D0D0DA] capitalize">{main}</p>
                    {count !== null && (
                      <span className="text-[11px] font-mono text-[#4A4A60]">× {count}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (id === 'recentIdeas') {
      if (!vis.showRecentIdeas) return null;
      return (
        <section key="recentIdeas">
          <SectionLabel label="Recent Ideas" href="/ideas" linkText="All ideas" />
          {recent.length === 0 ? (
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center">
              <p className="text-[12px] text-[#3A3A55] font-mono mb-2">No ideas yet</p>
              <p className="text-[10px] text-[#2A2A40] font-mono">Run a sync or add ideas manually to get started</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x scroll-smooth">
              {recent.map((idea) => (
                <div key={idea.id} className="w-[280px] shrink-0 snap-start">
                  <IdeaCard idea={idea} showDescription />
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (id === 'askAI') {
      if (!vis.showAskAI) return null;
      return (
        <section key="askAI">
          <SectionLabel label="Ask AI" />
          <div className="max-w-2xl mx-auto">
            <AskBox />
          </div>
        </section>
      );
    }

    if (id === 'attention') {
      if (!showNeeds && !showSugg) return null;
      const showBoth = showNeeds && showSugg;
      return (
        <section key="attention">
          <div className={showBoth ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start' : 'max-w-xl mx-auto'}>
            {showNeeds && (
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">Needs Attention</h2>
                  <span className="text-[10px] font-mono text-[#C06830] bg-[#C06830]/10 px-1.5 py-0.5 rounded">
                    {needsAttention.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {needsAttention.map((idea) => (
                    <Link key={idea.id} href={`/ideas/${idea.id}`} className="block">
                      <div className="bg-[#111118] border border-[#1E1E2E] hover:border-[#252535] rounded-xl px-5 py-4 min-h-[96px] flex flex-col justify-center transition-all card-glow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[12px] text-[#D0D0DA] font-medium truncate mb-1.5">{idea.title}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <StatusChip status={idea.status} size="sm" />
                              {idea.blockers && idea.blockers.length > 0 && (
                                <span className="text-[10px] font-mono text-[#C06830]">
                                  {idea.blockers.length} blocker{idea.blockers.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {idea.next_steps && idea.next_steps.length > 0 && (
                              <p className="text-[11px] text-[#4A4A60] font-mono truncate">
                                → {idea.next_steps[0]}
                              </p>
                            )}
                          </div>
                          <span className="text-[#3A3A55] text-[11px] shrink-0 mt-0.5">→</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {showSugg && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest flex items-center gap-2">
                    <span className="text-[#F7C948]">✦</span>
                    AI Suggestions
                  </h2>
                  <Link href="/suggestions" className="text-[10px] font-mono text-[#3A3A55] hover:text-[#F7C948] transition-colors">
                    All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {withSuggestions.map((idea) => (
                    <Link key={idea.id} href={`/ideas/${idea.id}`} className="block">
                      <div className="bg-[#111118] border border-[#1E1E2E] hover:border-[#252535] rounded-xl px-5 py-4 min-h-[96px] flex flex-col justify-center transition-all card-glow">
                        <p className="text-[12px] font-medium text-[#D0D0DA] mb-1.5 truncate">{idea.title}</p>
                        <p className="text-[11px] text-[#5E5E7A] line-clamp-2 leading-relaxed">{idea.ai_suggestions}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <main className="flex-1 px-4 lg:px-8 pt-14 pb-10 max-w-6xl mx-auto w-full space-y-14">
      {/* Inbox alert — always shown prominently */}
      {unprocessedCount > 0 && (
        <div className="flex items-center justify-between bg-[#F7C948]/5 border border-[#F7C948]/12 rounded-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F7C948] shrink-0 animate-pulse" />
            <p className="text-[12px] text-[#C0C0D0]">
              <span className="font-semibold text-[#E0E0EA]">{unprocessedCount}</span>{' '}
              unprocessed idea{unprocessedCount !== 1 ? 's' : ''} in your inbox
            </p>
          </div>
          <Link href="/inbox" className="text-[10px] font-mono text-[#F7C948] hover:text-[#E6B830] transition-colors">
            Process →
          </Link>
        </div>
      )}

      {vis.order.map(renderSection)}
    </main>
  );
}

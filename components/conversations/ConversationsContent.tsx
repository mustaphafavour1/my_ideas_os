'use client';

import { useMemo, useState } from 'react';
import { ConversationLog, UserStats } from '@/lib/types';

const PAGE_SIZE = 10;

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function fmtLines(n: number): string {
  if (n < 100) return '<100';
  return fmt(n);
}

function pageCount(n: number): number {
  return Math.max(1, Math.round(n / 250));
}

function pct(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

const SOURCE_LABELS: Record<string, string> = { claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini' };
function sourceLabel(key: string): string {
  return SOURCE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

type SortKey =
  | 'date_desc' | 'date_asc'
  | 'words_desc' | 'words_asc'
  | 'pages_desc' | 'pages_asc'
  | 'msgs_desc' | 'msgs_asc'
  | 'code_desc' | 'code_asc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Most recent' },
  { value: 'date_asc', label: 'Least recent' },
  { value: 'words_desc', label: 'Most words' },
  { value: 'words_asc', label: 'Fewest words' },
  { value: 'pages_desc', label: 'Most pages' },
  { value: 'pages_asc', label: 'Fewest pages' },
  { value: 'msgs_desc', label: 'Most messages' },
  { value: 'msgs_asc', label: 'Fewest messages' },
  { value: 'code_desc', label: 'Most code lines' },
  { value: 'code_asc', label: 'Fewest code lines' },
];

function sortLogs(logs: ConversationLog[], key: SortKey): ConversationLog[] {
  const msgs = (l: ConversationLog) => l.human_messages + l.assistant_messages;
  const sorted = [...logs];
  switch (key) {
    case 'date_asc':   return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'words_desc':
    case 'pages_desc': return sorted.sort((a, b) => b.total_words - a.total_words);
    case 'words_asc':
    case 'pages_asc':  return sorted.sort((a, b) => a.total_words - b.total_words);
    case 'msgs_desc':  return sorted.sort((a, b) => msgs(b) - msgs(a));
    case 'msgs_asc':   return sorted.sort((a, b) => msgs(a) - msgs(b));
    case 'code_desc':  return sorted.sort((a, b) => b.code_lines - a.code_lines);
    case 'code_asc':   return sorted.sort((a, b) => a.code_lines - b.code_lines);
    case 'date_desc':
    default:            return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

function MiniScoreRing({ score, label }: { score: number; label: string }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(score, 99) / 99) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 80, height: 80 }}>
        <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={40} cy={40} r={r} fill="none" stroke="#1A1A28" strokeWidth={5} />
          <circle
            cx={40} cy={40} r={r} fill="none"
            stroke="#F7C948"
            strokeWidth={5}
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[15px] font-bold text-[#F7C948] leading-none">{score}%</span>
          <span className="text-[7px] font-mono text-white/40 uppercase tracking-widest mt-0.5">AI score</span>
        </div>
      </div>
      <p className="text-[9px] font-mono text-white/50 text-center">{label}</p>
    </div>
  );
}

interface Props {
  logs: ConversationLog[];
  stats: UserStats | null;
  productivityScore?: number;
  productivityLabel?: string;
}

export function ConversationsContent({ logs, stats, productivityScore, productivityLabel }: Props) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');
  const empty = !stats && logs.length === 0;

  const sortedLogs = useMemo(() => sortLogs(logs, sortKey), [logs, sortKey]);
  const totalPages = Math.ceil(sortedLogs.length / PAGE_SIZE);
  const paginated = sortedLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (empty) {
    return (
      <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-5xl mx-auto w-full">
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center">
          <p className="text-[12px] text-white/60 font-mono mb-2">No conversations synced yet</p>
          <p className="text-[11px] text-white/30 font-mono">Sync your Claude export to see stats here</p>
        </div>
      </main>
    );
  }

  const humanPct = pct(stats?.total_human_words || 0, stats?.total_words || 1);
  const aiPct    = pct(stats?.total_assistant_words || 0, stats?.total_words || 1);

  const bySource = Object.entries(stats?.assistant_words_by_source || {})
    .filter(([, words]) => words > 0)
    .sort((a, b) => b[1] - a[1]);
  const bySourceTotal = bySource.reduce((s, [, w]) => s + w, 0) || 1;

  return (
    <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-5xl mx-auto w-full space-y-8">

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Conversations', value: fmt(stats.total_conversations) },
            { label: 'Total Words',   value: fmt(stats.total_words) },
            { label: 'Code Lines',    value: fmt(stats.total_code_lines) },
            { label: 'Code Blocks',   value: fmt(stats.total_code_blocks) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">{label}</p>
              <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Message breakdown — split bar + productivity score */}
      {stats && (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
          <h3 className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-5">Message Breakdown</h3>
          <div className="flex gap-6 items-center">

            {/* Combined split bar */}
            <div className="flex-1 min-w-0">
              {/* Split bar */}
              <div className="flex h-2.5 rounded-full overflow-hidden mb-4">
                <div style={{ width: `${humanPct}%`, background: '#F7C948' }} />
                <div style={{ width: `${aiPct}%`, background: '#7A7AF0' }} />
              </div>

              {/* Legend rows */}
              <div className="space-y-3">
                {/* You */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#F7C948] shrink-0" />
                    <span className="text-[12px] text-white/60 flex-1">You</span>
                    {/* Desktop: all inline */}
                    <div className="hidden sm:flex items-center gap-3">
                      <span className="text-[20px] font-bold text-[#F7C948] leading-none">{humanPct}%</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-white/70">{fmt(stats.total_human_words)} words</span>
                        <span className="text-[12px] font-mono text-white/40">~{pageCount(stats.total_human_words)} pages</span>
                      </div>
                    </div>
                  </div>
                  {/* Mobile: stacked below label */}
                  <div className="sm:hidden mt-1.5 pl-[22px] space-y-0.5">
                    <p className="text-[18px] font-bold text-[#F7C948] leading-none">{humanPct}%</p>
                    <p className="text-[11px] font-semibold text-white/70">{fmt(stats.total_human_words)} words</p>
                    <p className="text-[12px] font-mono text-white/40">~{pageCount(stats.total_human_words)} pages</p>
                  </div>
                </div>

                {/* AI (summed across all agents) */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#7A7AF0] shrink-0" />
                    <span className="text-[12px] text-white/60 flex-1">AI</span>
                    {/* Desktop: all inline */}
                    <div className="hidden sm:flex items-center gap-3">
                      <span className="text-[20px] font-bold text-[#7A7AF0] leading-none">{aiPct}%</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-white/70">{fmt(stats.total_assistant_words)} words</span>
                        <span className="text-[12px] font-mono text-white/40">~{pageCount(stats.total_assistant_words)} pages</span>
                      </div>
                    </div>
                  </div>
                  {/* Mobile: stacked below label */}
                  <div className="sm:hidden mt-1.5 pl-[22px] space-y-0.5">
                    <p className="text-[18px] font-bold text-[#7A7AF0] leading-none">{aiPct}%</p>
                    <p className="text-[11px] font-semibold text-white/70">{fmt(stats.total_assistant_words)} words</p>
                    <p className="text-[12px] font-mono text-white/40">~{pageCount(stats.total_assistant_words)} pages</p>
                  </div>

                  {/* Per-agent breakdown */}
                  {bySource.length > 0 && (
                    <div className="mt-2.5 pl-[22px] space-y-1.5">
                      {bySource.map(([source, words]) => {
                        const sPct = pct(words, bySourceTotal);
                        return (
                          <div key={source} className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-white/40 w-14 shrink-0">{sourceLabel(source)}</span>
                            <div className="flex-1 h-1 rounded-full bg-[#1A1A28] overflow-hidden">
                              <div className="h-full bg-[#7A7AF0]/60 rounded-full" style={{ width: `${sPct}%` }} />
                            </div>
                            <span className="text-[9px] font-mono text-white/30 w-8 text-right shrink-0">{sPct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Productivity Score mini ring */}
            {productivityScore !== undefined && (
              <div className="shrink-0 border-l border-[#1A1A28] pl-6">
                <MiniScoreRing score={productivityScore} label={productivityLabel || ''} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conversation log with pagination */}
      {logs.length > 0 && (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28] flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
              Conversation Log
              <span className="ml-2 text-white/20">({logs.length})</span>
            </h3>
            <div className="flex items-center gap-3">
              {totalPages > 1 && (
                <p className="text-[10px] font-mono text-white/30">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedLogs.length)} of {sortedLogs.length}
                </p>
              )}
              <select
                value={sortKey}
                onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }}
                className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-white/50 focus:outline-none focus:border-[#F7C948]/30 cursor-pointer transition-colors"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="divide-y divide-[#1A1A28]">
            {paginated.map((log, i) => (
              <div key={log.conversation_uuid || i} className="px-6 py-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[12px] text-white/80 font-medium leading-snug truncate">
                        {log.title || 'Untitled conversation'}
                      </p>
                      {log.source && log.source !== 'claude' && (
                        <span className="shrink-0 text-[8px] font-mono uppercase tracking-widest text-white/30 border border-[#1E1E2E] rounded px-1.5 py-0.5">
                          {sourceLabel(log.source)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-white/30">
                      {new Date(log.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 mt-0.5">
                    <div className="text-center hidden sm:block">
                      <p className="text-[12px] font-mono text-white/50">{fmt(log.total_words)}</p>
                      <p className="text-[9px] font-mono text-white/30">words</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-[12px] font-mono text-white/50">{pageCount(log.total_words)}</p>
                      <p className="text-[9px] font-mono text-white/30">pages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-mono text-white/50">{log.human_messages + log.assistant_messages}</p>
                      <p className="text-[9px] font-mono text-white/30">msgs</p>
                    </div>
                    {log.code_lines > 0 && (
                      <div className="text-center">
                        <p className="text-[12px] font-mono text-[#F7C948]">{fmtLines(log.code_lines)}</p>
                        <p className="text-[9px] font-mono text-white/30">code lines</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-[#1A1A28]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1E1E2E] text-white/40 hover:border-[#2A2A3A] hover:text-white/60 disabled:opacity-30 transition-colors text-[12px]"
              >
                ←
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7)          { p = i + 1; }
                else if (page <= 4)           { p = i + 1; }
                else if (page >= totalPages - 3) { p = totalPages - 6 + i; }
                else                          { p = page - 3 + i; }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-mono transition-colors ${
                      p === page
                        ? 'bg-[#F7C948] text-[#0A0A0F] font-semibold'
                        : 'border border-[#1E1E2E] text-white/40 hover:border-[#2A2A3A] hover:text-white/60'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1E1E2E] text-white/40 hover:border-[#2A2A3A] hover:text-white/60 disabled:opacity-30 transition-colors text-[12px]"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

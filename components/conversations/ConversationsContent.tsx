'use client';

import { useState } from 'react';
import { ConversationLog, UserStats } from '@/lib/types';

const PAGE_SIZE = 10;

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function pct(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
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
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginated = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const empty = !stats && logs.length === 0;

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
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#F7C948] shrink-0" />
                  <span className="text-[12px] text-white/60 flex-1">You</span>
                  <span className="text-[20px] font-bold text-[#F7C948] leading-none">{humanPct}%</span>
                  <span className="text-[13px] font-semibold text-white/70 w-20 text-right">{fmt(stats.total_human_words)} words</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#7A7AF0] shrink-0" />
                  <span className="text-[12px] text-white/60 flex-1">Claude</span>
                  <span className="text-[20px] font-bold text-[#7A7AF0] leading-none">{aiPct}%</span>
                  <span className="text-[13px] font-semibold text-white/70 w-20 text-right">{fmt(stats.total_assistant_words)} words</span>
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
          <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28] flex items-center justify-between">
            <h3 className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
              Conversation Log
              <span className="ml-2 text-white/20">({logs.length})</span>
            </h3>
            {totalPages > 1 && (
              <p className="text-[10px] font-mono text-white/30">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, logs.length)} of {logs.length}
              </p>
            )}
          </div>

          <div className="divide-y divide-[#1A1A28]">
            {paginated.map((log, i) => (
              <div key={log.conversation_uuid || i} className="px-6 py-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/80 font-medium mb-1 leading-snug">
                      {log.title || 'Untitled conversation'}
                    </p>
                    <p className="text-[10px] font-mono text-white/30">
                      {new Date(log.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 mt-0.5">
                    <div className="text-right hidden sm:block">
                      <p className="text-[12px] font-mono text-white/50">{fmt(log.total_words)}</p>
                      <p className="text-[9px] font-mono text-white/30">words</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-mono text-white/50">{log.human_messages + log.assistant_messages}</p>
                      <p className="text-[9px] font-mono text-white/30">msgs</p>
                    </div>
                    {log.code_lines > 0 && (
                      <div className="text-right">
                        <p className="text-[12px] font-mono text-[#F7C948]">{log.code_lines}</p>
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

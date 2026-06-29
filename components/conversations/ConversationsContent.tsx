'use client';

import { useState } from 'react';
import { ConversationLog, UserStats } from '@/lib/types';

const PAGE_SIZE = 20;

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function pct(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

interface Props {
  logs: ConversationLog[];
  stats: UserStats | null;
}

export function ConversationsContent({ logs, stats }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginated = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const empty = !stats && logs.length === 0;

  if (empty) {
    return (
      <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-5xl mx-auto w-full">
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center">
          <p className="text-[12px] text-[#3A3A55] font-mono mb-2">No conversations synced yet</p>
          <p className="text-[11px] text-[#2A2A40] font-mono">Sync your Claude export to see stats here</p>
        </div>
      </main>
    );
  }

  const humanPct = pct(stats?.total_human_words || 0, stats?.total_words || 1);
  const aiPct = pct(stats?.total_assistant_words || 0, stats?.total_words || 1);

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
              <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
              <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Message breakdown — bold & stylish */}
      {stats && (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
          <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest mb-6">Message Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-end justify-between mb-2.5">
                <span className="text-[13px] text-[#6A6A80]">Your messages</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[32px] font-bold text-[#F7C948] leading-none">{humanPct}%</span>
                  <span className="text-[12px] font-mono text-[#4A4A60]">{fmt(stats.total_human_words)} words</span>
                </div>
              </div>
              <div className="h-2 bg-[#1A1A28] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#F7C948] to-[#F7C948]/50 rounded-full transition-all" style={{ width: `${humanPct}%` }} />
              </div>
              <p className="text-[10px] font-mono text-[#3A3A55] mt-1.5">{stats.total_human_words.toLocaleString()} words total</p>
            </div>
            <div>
              <div className="flex items-end justify-between mb-2.5">
                <span className="text-[13px] text-[#6A6A80]">Claude&apos;s responses</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[32px] font-bold text-[#7A7AF0] leading-none">{aiPct}%</span>
                  <span className="text-[12px] font-mono text-[#4A4A60]">{fmt(stats.total_assistant_words)} words</span>
                </div>
              </div>
              <div className="h-2 bg-[#1A1A28] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#7A7AF0] to-[#7A7AF0]/50 rounded-full transition-all" style={{ width: `${aiPct}%` }} />
              </div>
              <p className="text-[10px] font-mono text-[#3A3A55] mt-1.5">{stats.total_assistant_words.toLocaleString()} words total</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversation log with pagination */}
      {logs.length > 0 && (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28] flex items-center justify-between">
            <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">
              Conversation Log
              <span className="ml-2 text-[#2A2A40]">({logs.length})</span>
            </h3>
            {totalPages > 1 && (
              <p className="text-[10px] font-mono text-[#3A3A55]">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, logs.length)} of {logs.length}
              </p>
            )}
          </div>

          <div className="divide-y divide-[#1A1A28]">
            {paginated.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#D0D0DA] font-medium mb-1 leading-snug">
                      {log.title || 'Untitled conversation'}
                    </p>
                    <p className="text-[10px] font-mono text-[#3A3A55]">
                      {new Date(log.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 mt-0.5">
                    <div className="text-right hidden sm:block">
                      <p className="text-[12px] font-mono text-[#8888A0]">{fmt(log.total_words)}</p>
                      <p className="text-[9px] font-mono text-[#3A3A55]">words</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-mono text-[#8888A0]">{log.human_messages + log.assistant_messages}</p>
                      <p className="text-[9px] font-mono text-[#3A3A55]">msgs</p>
                    </div>
                    {log.code_lines > 0 && (
                      <div className="text-right">
                        <p className="text-[12px] font-mono text-[#F7C948]">{log.code_lines}</p>
                        <p className="text-[9px] font-mono text-[#3A3A55]">lines</p>
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
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1E1E2E] text-[#4A4A60] hover:border-[#2A2A3A] hover:text-[#8888A0] disabled:opacity-30 transition-colors text-[12px]"
              >
                ←
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) { p = i + 1; }
                else if (page <= 4) { p = i + 1; }
                else if (page >= totalPages - 3) { p = totalPages - 6 + i; }
                else { p = page - 3 + i; }
                return (
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
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1E1E2E] text-[#4A4A60] hover:border-[#2A2A3A] hover:text-[#8888A0] disabled:opacity-30 transition-colors text-[12px]"
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

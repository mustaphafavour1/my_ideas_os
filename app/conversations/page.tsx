export const dynamic = 'force-dynamic';

import { TopBar } from '@/components/layout/TopBar';
import { createServiceClient } from '@/lib/supabase';
import { ConversationLog, UserStats } from '@/lib/types';
import { DEMO_CONVERSATIONS_LOG, DEMO_USER_STATS } from '@/lib/demo-data';

async function getData() {
  const supabase = createServiceClient();
  const [{ data: logs }, { data: stats }, { count: demoCount }] = await Promise.all([
    supabase.from('conversations_log').select('*').eq('user_id', 'favour').order('created_at', { ascending: false }),
    supabase.from('user_stats').select('*').eq('user_id', 'favour').single(),
    supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('user_id', 'favour').eq('source_ref', 'demo_mode'),
  ]);

  const isDemoActive = (demoCount ?? 0) > 0;
  const effectiveLogs = (logs && logs.length > 0)
    ? (logs as ConversationLog[])
    : isDemoActive ? (DEMO_CONVERSATIONS_LOG as unknown as ConversationLog[]) : [];
  const effectiveStats = (stats as UserStats | null) ?? (isDemoActive ? DEMO_USER_STATS : null);

  return { logs: effectiveLogs, stats: effectiveStats, isDemoActive };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function pct(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

export default async function ConversationsPage() {
  const { logs, stats } = await getData();
  const empty = !stats && logs.length === 0;

  const statCards = stats
    ? [
        { label: 'Conversations', value: fmt(stats.total_conversations) },
        { label: 'Total Words', value: fmt(stats.total_words) },
        { label: 'Code Lines', value: fmt(stats.total_code_lines) },
        { label: 'Code Blocks', value: fmt(stats.total_code_blocks) },
      ]
    : [];

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Conversations" subtitle="Your AI conversation history" />

      <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-5xl mx-auto w-full space-y-8">
        {empty ? (
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center">
            <p className="text-[12px] text-[#3A3A55] font-mono mb-2">No conversations synced yet</p>
            <p className="text-[11px] text-[#2A2A40] font-mono">Sync your Claude export to see stats here</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statCards.map(({ label, value }) => (
                  <div key={label} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3.5">
                    <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                    <p className="text-[22px] font-bold text-[#D0D0DA] leading-none">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Message breakdown */}
            {stats && (
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
                <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest mb-5">Message Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-[#6A6A80]">Your messages</span>
                      <span className="text-[11px] font-mono text-[#D0D0DA]">{fmt(stats.total_human_words)} words</span>
                    </div>
                    <div className="h-1.5 bg-[#1A1A28] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F7C948] rounded-full transition-all"
                        style={{ width: `${pct(stats.total_human_words, stats.total_words)}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-[#3A3A55] mt-1">
                      {pct(stats.total_human_words, stats.total_words)}% of total
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-[#6A6A80]">Claude&apos;s responses</span>
                      <span className="text-[11px] font-mono text-[#D0D0DA]">{fmt(stats.total_assistant_words)} words</span>
                    </div>
                    <div className="h-1.5 bg-[#1A1A28] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7A7AF0] rounded-full transition-all"
                        style={{ width: `${pct(stats.total_assistant_words, stats.total_words)}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-[#3A3A55] mt-1">
                      {pct(stats.total_assistant_words, stats.total_words)}% of total
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation log */}
            {logs.length > 0 && (
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28]">
                  <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">
                    Conversation Log
                    <span className="ml-2 text-[#2A2A40]">({logs.length})</span>
                  </h3>
                </div>
                <div className="divide-y divide-[#1A1A28]">
                  {logs.slice(0, 100).map((log) => (
                    <div key={log.id} className="px-6 py-3.5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-[#D0D0DA] font-medium truncate">{log.title || 'Untitled'}</p>
                        <p className="text-[10px] font-mono text-[#3A3A55] mt-0.5">
                          {new Date(log.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-5 shrink-0">
                        <div className="text-right">
                          <p className="text-[11px] font-mono text-[#8888A0]">{fmt(log.total_words)}</p>
                          <p className="text-[9px] font-mono text-[#3A3A55]">words</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-mono text-[#8888A0]">
                            {log.human_messages + log.assistant_messages}
                          </p>
                          <p className="text-[9px] font-mono text-[#3A3A55]">msgs</p>
                        </div>
                        {log.code_blocks > 0 && (
                          <div className="text-right">
                            <p className="text-[11px] font-mono text-[#F7C948]">{log.code_blocks}</p>
                            <p className="text-[9px] font-mono text-[#3A3A55]">code</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

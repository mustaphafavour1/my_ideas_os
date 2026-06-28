export const dynamic = 'force-dynamic';

import { TopBar } from '@/components/layout/TopBar';
import { createServiceClient } from '@/lib/supabase';
import { Idea, UserStats } from '@/lib/types';
import { DEMO_USER_STATS } from '@/lib/demo-data';

async function getData() {
  const supabase = createServiceClient();
  const [{ data: ideas }, { data: stats }] = await Promise.all([
    supabase.from('ideas').select('*').eq('user_id', 'favour'),
    supabase.from('user_stats').select('*').eq('user_id', 'favour').single(),
  ]);
  const allIdeas = (ideas || []) as Idea[];
  const isDemoActive = allIdeas.some((i) => i.source_ref === 'demo_mode');
  const effectiveStats = (stats as UserStats | null) ?? (isDemoActive ? DEMO_USER_STATS : null);
  return {
    ideas: allIdeas,
    stats: effectiveStats,
  };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function topEntries(items: (string | null)[]): { label: string; count: number }[] {
  const counts: Record<string, number> = {};
  items.forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => ({ label: label.replace(/_/g, ' '), count }));
}

export default async function ProfilePage() {
  const { ideas, stats } = await getData();

  const completed = ideas.filter((i) => i.status === 'completed').length;
  const inProgress = ideas.filter((i) => i.status === 'in_progress').length;
  const topSectors = topEntries(ideas.map((i) => i.sector));
  const topTypes = topEntries(ideas.map((i) => i.idea_type));
  const completionPct = ideas.length > 0 ? Math.round((completed / ideas.length) * 100) : 0;

  const firstIdeaDate = ideas.length > 0
    ? new Date(ideas.reduce((min, i) => i.created_at < min ? i.created_at : min, ideas[0].created_at))
    : null;

  const sinceYear = firstIdeaDate ? firstIdeaDate.getFullYear() : null;

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Profile" subtitle="Your AI builder profile" />

      <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-3xl mx-auto w-full space-y-8">

        {/* Shareable AI Card */}
        <section>
          <div className="mb-4">
            <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">AI Profile Card</h2>
            <p className="text-[11px] text-[#3A3A55] font-mono mt-0.5">Screenshot to share</p>
          </div>

          <div
            id="profile-card"
            className="relative rounded-2xl overflow-hidden border border-[#2A2A3A] p-8"
            style={{ background: 'linear-gradient(135deg, #0E0E1A 0%, #111122 50%, #0A0A14 100%)' }}
          >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #F7C948 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-5"
              style={{ background: 'radial-gradient(circle, #7A7AF0 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#F7C948] flex items-center justify-center shrink-0">
                    <span className="text-[#0A0A0F] font-bold text-xl">F</span>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-[#F0F0F5] tracking-tight">favour</p>
                    <p className="text-[11px] font-mono text-[#4A4A60] mt-0.5">
                      {sinceYear ? `Building since ${sinceYear}` : 'Idea Builder'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest">Idea OS</p>
                  <p className="text-[9px] font-mono text-[#3A3A55] mt-0.5">AI Profile</p>
                </div>
              </div>

              {/* Key stats grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#0A0A0F]/60 rounded-xl p-3.5 border border-[#1E1E2E]/60">
                  <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">Ideas</p>
                  <p className="text-[24px] font-bold text-[#F7C948] leading-none">{ideas.length}</p>
                </div>
                <div className="bg-[#0A0A0F]/60 rounded-xl p-3.5 border border-[#1E1E2E]/60">
                  <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">Shipped</p>
                  <p className="text-[24px] font-bold text-[#D0D0DA] leading-none">{completed}</p>
                </div>
                <div className="bg-[#0A0A0F]/60 rounded-xl p-3.5 border border-[#1E1E2E]/60">
                  <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">Completion</p>
                  <p className="text-[24px] font-bold text-[#D0D0DA] leading-none">{completionPct}%</p>
                </div>
              </div>

              {/* Conversations row */}
              {stats && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#0A0A0F]/60 rounded-xl p-3.5 border border-[#1E1E2E]/60">
                    <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">Convos</p>
                    <p className="text-[24px] font-bold text-[#7A7AF0] leading-none">{fmt(stats.total_conversations)}</p>
                  </div>
                  <div className="bg-[#0A0A0F]/60 rounded-xl p-3.5 border border-[#1E1E2E]/60">
                    <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">Words</p>
                    <p className="text-[24px] font-bold text-[#D0D0DA] leading-none">{fmt(stats.total_words)}</p>
                  </div>
                  <div className="bg-[#0A0A0F]/60 rounded-xl p-3.5 border border-[#1E1E2E]/60">
                    <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">Code Lines</p>
                    <p className="text-[24px] font-bold text-[#D0D0DA] leading-none">{fmt(stats.total_code_lines)}</p>
                  </div>
                </div>
              )}

              {/* Top sectors */}
              {topSectors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {topSectors.map(({ label }) => (
                    <span key={label} className="text-[10px] font-mono text-[#6A6A80] bg-[#1A1A28]/80 px-2.5 py-1 rounded-lg capitalize border border-[#2A2A3A]/60">
                      {label}
                    </span>
                  ))}
                  {topTypes.slice(0, 2).map(({ label }) => (
                    <span key={label} className="text-[10px] font-mono text-[#6A6A80] bg-[#1A1A28]/80 px-2.5 py-1 rounded-lg capitalize border border-[#2A2A3A]/60">
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[#1E1E2E]/40 pt-4">
                <p className="text-[9px] font-mono text-[#2A2A40]">ideas-os.vercel.app</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-[#F7C948] flex items-center justify-center">
                    <span className="text-[#0A0A0F] font-bold text-[7px]">IO</span>
                  </div>
                  <p className="text-[9px] font-mono text-[#3A3A55]">Powered by Claude</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats breakdown */}
        <section className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28]">
            <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">Idea Breakdown</h3>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Ideas', value: ideas.length },
              { label: 'In Progress', value: inProgress },
              { label: 'Completed', value: completed },
              { label: 'Completion %', value: `${completionPct}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-[20px] font-bold text-[#D0D0DA]">{value}</p>
              </div>
            ))}
          </div>
          {topSectors.length > 0 && (
            <div className="px-6 pb-6">
              <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-3">Top Sectors</p>
              <div className="space-y-2">
                {topSectors.map(({ label, count }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-[#1A1A28] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F7C948] rounded-full"
                        style={{ width: `${(count / ideas.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#8888A0] capitalize">{label}</span>
                    <span className="text-[10px] font-mono text-[#3A3A55] ml-auto">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {stats && (
          <section className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28]">
              <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">AI Conversation Stats</h3>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Conversations', value: fmt(stats.total_conversations) },
                { label: 'Total Words', value: fmt(stats.total_words) },
                { label: 'Code Lines', value: fmt(stats.total_code_lines) },
                { label: 'Code Blocks', value: fmt(stats.total_code_blocks) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest mb-1.5">{label}</p>
                  <p className="text-[20px] font-bold text-[#D0D0DA]">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

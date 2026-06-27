export const dynamic = 'force-dynamic';

import { TopBar } from '@/components/layout/TopBar';
import { StatCards } from '@/components/dashboard/StatCards';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { StatusChip } from '@/components/ui/StatusChip';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase';
import { Idea, DashboardStats } from '@/lib/types';

async function getDashboardData() {
  const supabase = createServiceClient();

  const [{ data: ideas }, { data: syncLog }, { data: inboxItems }] = await Promise.all([
    supabase.from('ideas').select('*').eq('user_id', 'favour').order('created_at', { ascending: false }),
    supabase.from('sync_log').select('synced_at').eq('user_id', 'favour').order('synced_at', { ascending: false }).limit(1),
    supabase.from('inbox').select('id').eq('user_id', 'favour').eq('processed', false),
  ]);

  const allIdeas = (ideas || []) as Idea[];
  const lastSynced = syncLog?.[0]?.synced_at || null;
  const unprocessedCount = (inboxItems || []).length;

  const graded = allIdeas.filter((i) => i.grade_overall !== null);
  const stats: DashboardStats = {
    total: allIdeas.length,
    in_progress: allIdeas.filter((i) => i.status === 'in_progress').length,
    completed: allIdeas.filter((i) => i.status === 'completed').length,
    avg_grade: graded.length > 0
      ? graded.reduce((sum, i) => sum + (i.grade_overall ?? 0), 0) / graded.length
      : 0,
  };

  const recent = allIdeas.slice(0, 6);
  const needsAttention = allIdeas.filter(
    (i) => i.status === 'paused' || (i.blockers && i.blockers.length > 0)
  ).slice(0, 4);
  const withSuggestions = allIdeas.filter((i) => i.ai_suggestions).slice(0, 3);

  return { stats, recent, needsAttention, withSuggestions, lastSynced, unprocessedCount };
}

export default async function DashboardPage() {
  const { stats, recent, needsAttention, withSuggestions, lastSynced, unprocessedCount } =
    await getDashboardData();

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Dashboard"
        subtitle={`${stats.total} ideas total`}
        lastSynced={lastSynced}
      />

      <main className="flex-1 px-4 lg:px-8 py-8 space-y-10 max-w-6xl mx-auto w-full">
        {/* Stats */}
        <section>
          <StatCards stats={stats} />
        </section>

        {/* Inbox alert */}
        {unprocessedCount > 0 && (
          <div className="flex items-center justify-between bg-[#F7C948]/6 border border-[#F7C948]/15 rounded-xl px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F7C948] shrink-0" />
              <p className="text-[12px] text-[#C0C0D0]">
                <span className="font-semibold text-[#E0E0EA]">{unprocessedCount}</span> unprocessed idea{unprocessedCount !== 1 ? 's' : ''} in your inbox
              </p>
            </div>
            <Link href="/inbox" className="text-[11px] font-mono text-[#F7C948] hover:text-[#E6B830] transition-colors">
              Process →
            </Link>
          </div>
        )}

        {/* Recent Ideas */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">Recent Ideas</h2>
            <Link href="/ideas" className="text-[11px] font-mono text-[#4A4A60] hover:text-[#F7C948] transition-colors">
              All ideas →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-12 text-center">
              <p className="text-[12px] text-[#3A3A55] font-mono mb-2">No ideas yet</p>
              <p className="text-[11px] text-[#2A2A40] font-mono">Run a sync or add ideas manually to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
            </div>
          )}
        </section>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <section>
            <div className="flex items-center gap-2.5 mb-5">
              <h2 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">Needs Attention</h2>
              <span className="text-[10px] font-mono text-[#C06830] bg-[#C06830]/10 px-1.5 py-0.5 rounded">
                {needsAttention.length}
              </span>
            </div>
            <div className="space-y-2">
              {needsAttention.map((idea) => (
                <Link key={idea.id} href={`/ideas/${idea.id}`}>
                  <div className="flex items-center justify-between bg-[#111118] border border-[#1E1E2E] hover:border-[#252535] rounded-xl px-5 py-3.5 transition-all card-glow">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[12px] text-[#D0D0DA] font-medium truncate">{idea.title}</span>
                      <StatusChip status={idea.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {idea.blockers && idea.blockers.length > 0 && (
                        <span className="text-[11px] font-mono text-[#C06830]">
                          {idea.blockers.length} blocker{idea.blockers.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-[#3A3A55] text-[11px]">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest AI Suggestions */}
        {withSuggestions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#F7C948]">✦</span>
                AI Suggestions
              </h2>
              <Link href="/suggestions" className="text-[11px] font-mono text-[#4A4A60] hover:text-[#F7C948] transition-colors">
                All suggestions →
              </Link>
            </div>
            <div className="space-y-3">
              {withSuggestions.map((idea) => (
                <div key={idea.id} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-5 py-4 hover:border-[#252535] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[#D0D0DA] mb-1.5">{idea.title}</p>
                      <p className="text-[11px] text-[#5E5E7A] line-clamp-2 leading-relaxed">{idea.ai_suggestions}</p>
                    </div>
                    <Link
                      href={`/ideas/${idea.id}`}
                      className="shrink-0 text-[11px] font-mono text-[#4A4A60] hover:text-[#F7C948] transition-colors mt-0.5"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

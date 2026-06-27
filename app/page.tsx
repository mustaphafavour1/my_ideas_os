export const dynamic = 'force-dynamic';

import { TopBar } from '@/components/layout/TopBar';
import { StatCards } from '@/components/dashboard/StatCards';
import { AskBox } from '@/components/dashboard/AskBox';
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

  const recent = allIdeas.slice(0, 4);
  const needsAttention = allIdeas.filter(
    (i) => i.status === 'paused' || (i.blockers && i.blockers.length > 0)
  ).slice(0, 5);
  const withSuggestions = allIdeas.filter((i) => i.ai_suggestions).slice(0, 5);

  return { stats, recent, needsAttention, withSuggestions, lastSynced, unprocessedCount };
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

      <main className="flex-1 px-4 lg:px-8 py-10 max-w-6xl mx-auto w-full space-y-16">
        {/* Stats */}
        <section>
          <StatCards stats={stats} />
        </section>

        {/* Inbox alert */}
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

        {/* AI Ask Box */}
        <section>
          <AskBox />
        </section>

        {/* Recent Ideas — horizontal scroll row of 4 */}
        <section>
          <SectionLabel label="Recent Ideas" href="/ideas" linkText="All ideas" />
          {recent.length === 0 ? (
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center">
              <p className="text-[12px] text-[#3A3A55] font-mono mb-2">No ideas yet</p>
              <p className="text-[10px] text-[#2A2A40] font-mono">Run a sync or add ideas manually to get started</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-1 -mx-4 px-4 lg:-mx-8 lg:px-8 snap-x scroll-smooth">
              {recent.map((idea) => (
                <div key={idea.id} className="w-[280px] shrink-0 snap-start">
                  <IdeaCard idea={idea} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Needs Attention + AI Suggestions — side by side */}
        {(needsAttention.length > 0 || withSuggestions.length > 0) && (
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Needs Attention */}
              {needsAttention.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">Needs Attention</h2>
                    <span className="text-[10px] font-mono text-[#C06830] bg-[#C06830]/10 px-1.5 py-0.5 rounded">
                      {needsAttention.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {needsAttention.map((idea) => (
                      <Link key={idea.id} href={`/ideas/${idea.id}`}>
                        <div className="bg-[#111118] border border-[#1E1E2E] hover:border-[#252535] rounded-xl px-5 py-4 transition-all card-glow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[12px] text-[#D0D0DA] font-medium truncate mb-1.5">{idea.title}</p>
                              <div className="flex items-center gap-2">
                                <StatusChip status={idea.status} size="sm" />
                                {idea.blockers && idea.blockers.length > 0 && (
                                  <span className="text-[10px] font-mono text-[#C06830]">
                                    {idea.blockers.length} blocker{idea.blockers.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[#3A3A55] text-[11px] shrink-0 mt-0.5">→</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {withSuggestions.length > 0 && (
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
                  <div className="space-y-2">
                    {withSuggestions.map((idea) => (
                      <Link key={idea.id} href={`/ideas/${idea.id}`}>
                        <div className="bg-[#111118] border border-[#1E1E2E] hover:border-[#252535] rounded-xl px-5 py-4 transition-all card-glow">
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
        )}
      </main>
    </div>
  );
}

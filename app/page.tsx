export const dynamic = 'force-dynamic';

import { TopBar } from '@/components/layout/TopBar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
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
  ).slice(0, 5);
  const withSuggestions = allIdeas.filter((i) => i.ai_suggestions).slice(0, 5);

  const withBlockers = allIdeas.filter((i) => i.blockers && i.blockers.length > 0).length;
  const paused = allIdeas.filter((i) => i.status === 'paused').length;

  const sectorCounts: Record<string, number> = {};
  allIdeas.forEach((i) => { if (i.sector) sectorCounts[i.sector] = (sectorCounts[i.sector] || 0) + 1; });
  const topSectorEntry = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];

  const typeCounts: Record<string, number> = {};
  allIdeas.forEach((i) => { if (i.idea_type) typeCounts[i.idea_type] = (typeCounts[i.idea_type] || 0) + 1; });
  const topTypeEntry = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const pausedSectorCounts: Record<string, number> = {};
  allIdeas.filter((i) => i.status === 'paused').forEach((i) => {
    if (i.sector) pausedSectorCounts[i.sector] = (pausedSectorCounts[i.sector] || 0) + 1;
  });
  const mostPausedEntry = Object.entries(pausedSectorCounts).sort((a, b) => b[1] - a[1])[0];

  const completedTypeCounts: Record<string, number> = {};
  allIdeas.filter((i) => i.status === 'completed').forEach((i) => {
    if (i.idea_type) completedTypeCounts[i.idea_type] = (completedTypeCounts[i.idea_type] || 0) + 1;
  });
  const mostCompletedEntry = Object.entries(completedTypeCounts).sort((a, b) => b[1] - a[1])[0];

  const blockedTypeCounts: Record<string, number> = {};
  allIdeas.filter((i) => i.blockers && i.blockers.length > 0).forEach((i) => {
    if (i.idea_type) blockedTypeCounts[i.idea_type] = (blockedTypeCounts[i.idea_type] || 0) + 1;
  });
  const mostBlockersEntry = Object.entries(blockedTypeCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    lastSynced,
    stats,
    recent,
    needsAttention,
    withSuggestions,
    unprocessedCount,
    withBlockers,
    paused,
    topSector: topSectorEntry?.[0] || null,
    topSectorCount: topSectorEntry?.[1] || 0,
    topType: topTypeEntry?.[0] || null,
    topTypeCount: topTypeEntry?.[1] || 0,
    completionPct,
    mostPausedSector: mostPausedEntry?.[0] || null,
    mostPausedCount: mostPausedEntry?.[1] || 0,
    mostCompletedType: mostCompletedEntry?.[0] || null,
    mostCompletedCount: mostCompletedEntry?.[1] || 0,
    mostBlockersType: mostBlockersEntry?.[0] || null,
    mostBlockersCount: mostBlockersEntry?.[1] || 0,
  };
}

export default async function DashboardPage() {
  const { lastSynced, ...contentProps } = await getDashboardData();

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Dashboard"
        subtitle={`${contentProps.stats.total} ideas total`}
        lastSynced={lastSynced}
      />
      <DashboardContent {...contentProps} />
    </div>
  );
}

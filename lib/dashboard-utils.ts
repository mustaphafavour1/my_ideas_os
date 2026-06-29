import { Idea, DashboardStats, UserStats } from './types';
import { computeProductivityScore, scoreLabel } from './productivity';

export function getRangeCutoff(range: string, from?: string, to?: string): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (range) {
    case 'today': { const s = new Date(now); s.setHours(0, 0, 0, 0); return { from: s, to: null }; }
    case 'week': return { from: new Date(now.getTime() - 7 * 86400000), to: null };
    case 'month': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    case 'quarter': { const q = Math.floor(now.getMonth() / 3); return { from: new Date(now.getFullYear(), q * 3, 1), to: null }; }
    case 'year': return { from: new Date(now.getFullYear(), 0, 1), to: null };
    case 'custom': return { from: from ? new Date(from) : null, to: to ? new Date(to) : null };
    default: return { from: null, to: null };
  }
}

export function computeDashboardProps(
  allIdeas: Idea[],
  userStats: UserStats | null,
  lastSynced: string | null,
  unprocessedCount: number,
  range: string,
  rangeFrom?: string,
  rangeTo?: string,
) {
  const productivityScore = computeProductivityScore(allIdeas, userStats);
  const productivityLabel = scoreLabel(productivityScore);
  const cutoff = getRangeCutoff(range, rangeFrom, rangeTo);

  const filteredIdeas = cutoff.from || cutoff.to
    ? allIdeas.filter((i) => {
        const d = new Date(i.created_at);
        if (cutoff.from && d < cutoff.from) return false;
        if (cutoff.to && d > cutoff.to) return false;
        return true;
      })
    : allIdeas;

  const graded = filteredIdeas.filter((i) => i.grade_overall !== null);
  const stats: DashboardStats = {
    total: filteredIdeas.length,
    in_progress: filteredIdeas.filter((i) => i.status === 'in_progress').length,
    completed: filteredIdeas.filter((i) => i.status === 'completed').length,
    avg_grade: graded.length > 0
      ? graded.reduce((sum, i) => sum + (i.grade_overall ?? 0), 0) / graded.length
      : 0,
  };

  const recent = allIdeas.slice(0, 6);
  const needsAttention = allIdeas.filter(
    (i) => i.status !== 'completed' && i.status !== 'archived' &&
      (i.status === 'paused' || (i.blockers && i.blockers.length > 0))
  ).slice(0, 5);
  const withSuggestions = allIdeas.filter(
    (i) => i.status !== 'completed' && i.status !== 'archived' && i.ai_suggestions
  ).slice(0, 5);

  const withBlockers = filteredIdeas.filter((i) => i.blockers && i.blockers.length > 0).length;
  const paused = filteredIdeas.filter((i) => i.status === 'paused').length;

  const sectorCounts: Record<string, number> = {};
  filteredIdeas.forEach((i) => { if (i.sector) sectorCounts[i.sector] = (sectorCounts[i.sector] || 0) + 1; });
  const topSectorEntry = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];

  const typeCounts: Record<string, number> = {};
  filteredIdeas.forEach((i) => { if (i.idea_type) typeCounts[i.idea_type] = (typeCounts[i.idea_type] || 0) + 1; });
  const topTypeEntry = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const pausedSectorCounts: Record<string, number> = {};
  filteredIdeas.filter((i) => i.status === 'paused').forEach((i) => {
    if (i.sector) pausedSectorCounts[i.sector] = (pausedSectorCounts[i.sector] || 0) + 1;
  });
  const mostPausedEntry = Object.entries(pausedSectorCounts).sort((a, b) => b[1] - a[1])[0];

  const completedTypeCounts: Record<string, number> = {};
  filteredIdeas.filter((i) => i.status === 'completed').forEach((i) => {
    if (i.idea_type) completedTypeCounts[i.idea_type] = (completedTypeCounts[i.idea_type] || 0) + 1;
  });
  const mostCompletedEntry = Object.entries(completedTypeCounts).sort((a, b) => b[1] - a[1])[0];

  const blockedTypeCounts: Record<string, number> = {};
  filteredIdeas.filter((i) => i.blockers && i.blockers.length > 0).forEach((i) => {
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
    productivityScore,
    productivityLabel,
    range,
    rangeFrom,
    rangeTo,
  };
}

import { Idea, DashboardStats, UserStats } from './types';
import { computeProductivityScore, scoreLabel } from './productivity';

// The date an idea should be filtered/sorted by is when it was actually
// discussed, not when the row happened to be inserted (sync time) — chat_date
// falls back to updated_at, then created_at, for older rows synced before
// chat_date was tracked reliably.
export function ideaDate(idea: Idea): string {
  return idea.chat_date || idea.updated_at || idea.created_at;
}

// Granularity + offset model: offset 0 = current period, 1 = previous period,
// 2 = two periods back, etc. — same shape for every granularity so "daily"
// (today/yesterday/2 days ago) and "yearly" (this year/last year/2 years ago)
// behave identically, just at different scales.
export function getRangeCutoff(
  range: string,
  from?: string,
  to?: string,
  offset?: string | number
): { from: Date | null; to: Date | null } {
  const now = new Date();
  const off = Math.max(0, typeof offset === 'number' ? offset : parseInt(offset || '0', 10) || 0);

  switch (range) {
    case 'daily': {
      const s = new Date(now); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - off);
      const e = new Date(s); e.setDate(e.getDate() + 1);
      return { from: s, to: e };
    }
    case 'weekly': {
      const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday
      const s = new Date(now); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - dayOfWeek - off * 7);
      const e = new Date(s); e.setDate(e.getDate() + 7);
      return { from: s, to: e };
    }
    case 'monthly': {
      const s = new Date(now.getFullYear(), now.getMonth() - off, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - off + 1, 1);
      return { from: s, to: e };
    }
    case 'quarterly': {
      const q = Math.floor(now.getMonth() / 3);
      const s = new Date(now.getFullYear(), (q - off) * 3, 1);
      const e = new Date(now.getFullYear(), (q - off + 1) * 3, 1);
      return { from: s, to: e };
    }
    case 'yearly': {
      const s = new Date(now.getFullYear() - off, 0, 1);
      const e = new Date(now.getFullYear() - off + 1, 0, 1);
      return { from: s, to: e };
    }
    case 'custom':
      return { from: from ? new Date(from) : null, to: to ? new Date(to) : null };
    // Legacy values — kept so any old bookmarked/shared URL still filters
    // sensibly instead of erroring.
    case 'today': { const s = new Date(now); s.setHours(0, 0, 0, 0); return { from: s, to: null }; }
    case 'week': return { from: new Date(now.getTime() - 7 * 86400000), to: null };
    case 'month': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    case 'quarter': { const q = Math.floor(now.getMonth() / 3); return { from: new Date(now.getFullYear(), q * 3, 1), to: null }; }
    case 'year': return { from: new Date(now.getFullYear(), 0, 1), to: null };
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
  rangeOffset?: string,
) {
  const productivityScore = computeProductivityScore(allIdeas, userStats);
  const productivityLabel = scoreLabel(productivityScore);
  const cutoff = getRangeCutoff(range, rangeFrom, rangeTo, rangeOffset);

  const filteredIdeas = cutoff.from || cutoff.to
    ? allIdeas.filter((i) => {
        const d = new Date(ideaDate(i));
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
    rangeOffset,
  };
}

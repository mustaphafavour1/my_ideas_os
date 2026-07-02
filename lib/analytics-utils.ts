import { Idea, ConversationLog } from './types';
import { ideaDate } from './dashboard-utils';

// Ideas are filtered by when they were actually discussed (chat_date),
// conversation logs by their own created_at — both are real conversation
// dates, never sync/insert time.
export function filterIdeasByRange(items: Idea[], cutoff: { from: Date | null; to: Date | null }): Idea[] {
  if (!cutoff.from && !cutoff.to) return items;
  return items.filter((i) => {
    const d = new Date(ideaDate(i));
    if (cutoff.from && d < cutoff.from) return false;
    if (cutoff.to && d > cutoff.to) return false;
    return true;
  });
}

export function filterLogsByRange(items: ConversationLog[], cutoff: { from: Date | null; to: Date | null }): ConversationLog[] {
  if (!cutoff.from && !cutoff.to) return items;
  return items.filter((l) => {
    const d = new Date(l.created_at);
    if (cutoff.from && d < cutoff.from) return false;
    if (cutoff.to && d > cutoff.to) return false;
    return true;
  });
}

export function computeStreaks(logs: ConversationLog[]): { current: number; longest: number } {
  if (logs.length === 0) return { current: 0, longest: 0 };
  const dates = [...new Set(logs.map((l) => l.created_at.split('T')[0]))].sort();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let longest = 1, streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    streak = diff === 1 ? streak + 1 : 1;
    if (streak > longest) longest = streak;
  }

  let current = 0;
  const lastDate = dates[dates.length - 1];
  if (lastDate === today || lastDate === yesterday) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const diff = (new Date(dates[i + 1]).getTime() - new Date(dates[i]).getTime()) / 86400000;
      if (diff === 1) current++;
      else break;
    }
  }
  return { current, longest };
}

export function buildInsights(ideas: Idea[]): string[] {
  const insights: string[] = [];
  const typeCounts: Record<string, { completed: number; inProgress: number; total: number; blocked: number }> = {};
  ideas.forEach((i) => {
    const type = i.idea_type || 'untyped';
    if (!typeCounts[type]) typeCounts[type] = { completed: 0, inProgress: 0, total: 0, blocked: 0 };
    typeCounts[type].total++;
    if (i.status === 'completed') typeCounts[type].completed++;
    if (i.status === 'in_progress') typeCounts[type].inProgress++;
    if (i.blockers && i.blockers.length > 0) typeCounts[type].blocked++;
  });
  Object.entries(typeCounts).sort((a, b) => b[1].total - a[1].total).slice(0, 4).forEach(([type, counts]) => {
    const label = type.replace(/_/g, ' ');
    if (counts.completed > 0) insights.push(`${counts.completed} ${label} idea${counts.completed !== 1 ? 's' : ''} completed`);
    if (counts.inProgress > 0) insights.push(`${counts.inProgress} ${label} idea${counts.inProgress !== 1 ? 's' : ''} in progress`);
    if (counts.blocked > 0) insights.push(`${counts.blocked} ${label} idea${counts.blocked !== 1 ? 's' : ''} ${counts.blocked !== 1 ? 'have' : 'has'} blockers`);
  });
  const paused = ideas.filter((i) => i.status === 'paused').length;
  if (paused > 0) insights.push(`${paused} idea${paused !== 1 ? 's' : ''} currently paused`);

  const parentIds = new Set(ideas.filter((i) => i.parent_idea_id).map((i) => i.parent_idea_id));
  const groupCount = ideas.filter((i) => parentIds.has(i.id)).length;
  if (groupCount > 0) insights.push(`${groupCount} idea${groupCount !== 1 ? 's' : ''} have related sub-ideas`);

  return insights.slice(0, 8);
}

export function avgDaysBetweenChats(ideas: Idea[]): string {
  const withDates = ideas.filter((i) => i.chat_date && i.updated_at);
  if (withDates.length === 0) return '—';
  const diffs = withDates.map((i) => Math.abs(new Date(i.updated_at).getTime() - new Date(i.chat_date!).getTime()) / 86400000);
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return avg < 1 ? '<1' : Math.round(avg).toString();
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

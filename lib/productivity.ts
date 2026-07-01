import { Idea, UserStats } from './types';

export function computeProductivityScore(ideas: Idea[], stats: UserStats | null): number {
  const convos    = stats?.total_conversations || 0;
  const codeLines = stats?.total_code_lines    || 0;
  const completed = ideas.filter((i) => i.status === 'completed').length;
  const completionRate = ideas.length > 0 ? completed / ideas.length : 0;

  // Depth: quality of captured ideas (description + grade + next steps)
  const withDesc      = ideas.filter((i) => i.description && i.description.trim().length > 10).length;
  const withGrade     = ideas.filter((i) => i.grade_overall !== null).length;
  const withNextSteps = ideas.filter((i) => i.next_steps && i.next_steps.length > 0).length;
  const depthRate     = ideas.length > 0
    ? (withDesc + withGrade + withNextSteps) / (ideas.length * 3)
    : 0;

  // High thresholds — a full multi-platform import (Claude + ChatGPT, and
  // eventually more) can trivially cross what used to be the ceiling here on
  // raw volume alone, so these are scaled up an order of magnitude and the
  // weighting shifts toward execution/depth — actually finishing and
  // fleshing out ideas — rather than how much raw chat history you imported.
  const volumeScore    = (convos       / 800)    * 100;  // 800 conversations   = 100%
  const outputScore    = (codeLines    / 300000) * 100;  // 300 000 code lines  = 100%
  const ideasScore     = (ideas.length / 800)    * 100;  // 800 ideas          = 100%
  const executionScore = completionRate           * 100;
  const depthScore     = depthRate                * 100;

  const raw = Math.round(
    volumeScore    * 0.20 +
    outputScore    * 0.20 +
    ideasScore     * 0.15 +
    executionScore * 0.25 +
    depthScore     * 0.20,
  );

  return Math.min(99, raw); // 99% ceiling — AI can always do more
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'AI Native';
  if (score >= 60) return 'Elite Builder';
  if (score >= 40) return 'Power Builder';
  if (score >= 20) return 'Active Builder';
  return 'Getting Started';
}

// ── Personality ──────────────────────────────────────────────────────────────

export interface PersonalityResult {
  type: string;
  description: string;
}

export function computePersonality(ideas: Idea[], stats: UserStats | null): PersonalityResult {
  const typeCounts: Record<string, number> = {};
  ideas.forEach((i) => { if (i.idea_type) typeCounts[i.idea_type] = (typeCounts[i.idea_type] || 0) + 1; });

  const products = (typeCounts.product || 0) + (typeCounts.automation || 0);
  const research = (typeCounts.research || 0) + (typeCounts.experiment || 0);
  const content = (typeCounts.content || 0) + (typeCounts.community || 0);
  const uniqueSectors = new Set(ideas.map((i) => i.sector).filter(Boolean)).size;
  const codeLines = stats?.total_code_lines || 0;
  const completionRate = ideas.length > 0 ? ideas.filter((i) => i.status === 'completed').length / ideas.length : 0;

  const scores: Record<string, number> = {
    builder: products * 2 + Math.min(12, codeLines / 200),
    researcher: research * 2 + Math.min(6, (stats?.total_words || 0) / 8000),
    explorer: Math.min(14, uniqueSectors * 1.4) + (ideas.length > 15 ? 3 : 0),
    founder: products + uniqueSectors * 0.5 + (completionRate > 0.15 ? 4 : 0),
    creator: content * 2,
  };

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

  const map: Record<string, PersonalityResult> = {
    builder:    { type: 'Builder',    description: 'Creates tangible products and tools' },
    researcher: { type: 'Researcher', description: 'Explores ideas deeply before building' },
    explorer:   { type: 'Explorer',   description: 'Ranges widely across many domains' },
    founder:    { type: 'Founder',    description: 'Thinks in businesses and markets' },
    creator:    { type: 'Creator',    description: 'Makes content and communities' },
  };

  return map[top] ?? { type: 'Thinker', description: 'Explores ideas broadly' };
}

// ── Temperament ───────────────────────────────────────────────────────────────

export interface TemperamentResult {
  key: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
}

const TEMPERAMENTS: Record<string, Omit<TemperamentResult, 'key'>> = {
  strategos: {
    name: 'Strategos',
    subtitle: 'The Planner',
    description: 'You operate with structure and foresight — every idea has a path.',
    color: '#F7C948',
  },
  kairos: {
    name: 'Kairos',
    subtitle: 'The Opportunist',
    description: 'You sense timing and move early on emerging patterns.',
    color: '#7A7AF0',
  },
  poietes: {
    name: 'Poietes',
    subtitle: 'The Maker',
    description: 'You build concrete things from abstract concepts.',
    color: '#4CAF82',
  },
  sophron: {
    name: 'Sophron',
    subtitle: 'The Sage',
    description: 'You consider all angles deeply before committing.',
    color: '#E07B54',
  },
};

export function computeTemperament(ideas: Idea[], stats: UserStats | null): TemperamentResult {
  const s = { strategos: 0, kairos: 0, poietes: 0, sophron: 0 };

  ideas.forEach((idea) => {
    if ((idea.next_steps?.length || 0) > 2) s.strategos += 1.5;
    if (['in_progress', 'completed'].includes(idea.status)) s.strategos += 0.5;
    if (['product', 'automation', 'framework'].includes(idea.idea_type || '')) s.poietes += 1;
    if (['captured', 'lightly_researched'].includes(idea.status)) s.sophron += 0.5;
    if (['research', 'experiment'].includes(idea.idea_type || '')) s.sophron += 1;
  });

  const uniqueSectors = new Set(ideas.map((i) => i.sector).filter(Boolean)).size;
  s.kairos += Math.min(10, uniqueSectors * 1.2);

  if (stats) {
    if (stats.total_code_lines > 500)  s.poietes += 5;
    if (stats.total_code_lines > 2000) s.poietes += 6;
    if (stats.total_conversations > 15) s.kairos += 3;
    if (stats.total_human_words > 8000) s.sophron += 4;
  }

  const key = Object.entries(s).sort((a, b) => b[1] - a[1])[0][0];
  return { key, ...TEMPERAMENTS[key] };
}

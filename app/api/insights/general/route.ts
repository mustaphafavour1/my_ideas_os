import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';
import { generateGeneralInsights, GeneralInsightsSummary } from '@/lib/claude';
import { Idea, UserStats } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MIN_IDEAS_FOR_INSIGHTS = 3;
const PAID_PLANS = new Set(['one-time', 'monthly', 'enterprise']);

function avg(nums: (number | null | undefined)[]): number | null {
  const valid = nums.filter((n): n is number => typeof n === 'number');
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

// grade_overall is never populated by the extraction/sync pipeline — the
// real per-idea grades are the five sub-scores, so the overall is derived
// here from those instead of trusting the (always-null) column.
function ideaOverallGrade(i: Idea): number | null {
  return avg([i.grade_novelty, i.grade_feasibility, i.grade_personal_fit, i.grade_market_potential, i.grade_urgency]);
}

function buildSummary(ideas: Idea[], userStats: UserStats | null): GeneralInsightsSummary {
  const statusBreakdown: Record<string, number> = {};
  const bySector = new Map<string, Idea[]>();
  const byType = new Map<string, Idea[]>();

  for (const idea of ideas) {
    statusBreakdown[idea.status] = (statusBreakdown[idea.status] || 0) + 1;
    const sector = idea.sector || 'unspecified';
    const type = idea.idea_type || 'unspecified';
    if (!bySector.has(sector)) bySector.set(sector, []);
    bySector.get(sector)!.push(idea);
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(idea);
  }

  const toBreakdown = (map: Map<string, Idea[]>) =>
    [...map.entries()]
      .map(([key, group]) => ({
        key,
        count: group.length,
        avgGrade: avg(group.map(ideaOverallGrade)),
        completedCount: group.filter((i) => i.status === 'completed').length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

  const monthsExperience = userStats?.first_conversation_at
    ? Math.max(0, Math.round((Date.now() - new Date(userStats.first_conversation_at).getTime()) / (30 * 86400000)))
    : 0;

  return {
    totalIdeas: ideas.length,
    monthsExperience,
    totalConversations: userStats?.total_conversations || 0,
    totalWords: userStats?.total_words || 0,
    totalCodeLines: userStats?.total_code_lines || 0,
    assistantWordsBySource: userStats?.assistant_words_by_source || null,
    statusBreakdown,
    sectorBreakdown: toBreakdown(bySector).map((b) => ({ sector: b.key, count: b.count, avgGrade: b.avgGrade, completedCount: b.completedCount })),
    typeBreakdown: toBreakdown(byType).map((b) => ({ idea_type: b.key, count: b.count, avgGrade: b.avgGrade, completedCount: b.completedCount })),
    avgGrades: {
      novelty: avg(ideas.map((i) => i.grade_novelty)),
      feasibility: avg(ideas.map((i) => i.grade_feasibility)),
      personal_fit: avg(ideas.map((i) => i.grade_personal_fit)),
      market_potential: avg(ideas.map((i) => i.grade_market_potential)),
      urgency: avg(ideas.map((i) => i.grade_urgency)),
      overall: avg(ideas.map(ideaOverallGrade)),
    },
  };
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const [{ count: ideaCount }, { data: statsRow }, { data: userRow }] = await Promise.all([
    supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('user_stats').select('general_insights, general_insights_generated_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('users').select('plan').eq('id', user.id).maybeSingle(),
  ]);

  return NextResponse.json({
    insights: statsRow?.general_insights || null,
    generated_at: statsRow?.general_insights_generated_at || null,
    eligible: (ideaCount || 0) >= MIN_IDEAS_FOR_INSIGHTS,
    ideas_count: ideaCount || 0,
    is_paid: PAID_PLANS.has(userRow?.plan ?? ''),
  });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createServiceClient();
    const body = await req.json().catch(() => ({}));
    const userApiKey: string | null = body.apiKey || null;

    const [{ data: ideas }, { data: userStats }, { data: userRow }] = await Promise.all([
      supabase.from('ideas').select('*').eq('user_id', user.id),
      supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('users').select('plan').eq('id', user.id).maybeSingle(),
    ]);

    const ideaRows = (ideas || []) as Idea[];
    if (ideaRows.length < MIN_IDEAS_FOR_INSIGHTS) {
      return NextResponse.json(
        { error: `Sync or add at least ${MIN_IDEAS_FOR_INSIGHTS} ideas to unlock general insights.` },
        { status: 400 }
      );
    }

    // Same plan gate as /api/sync: paid plans run on our key, everyone else
    // brings their own — so this feature carries no API cost for free users.
    const isPaid = PAID_PLANS.has(userRow?.plan ?? '');
    if (!isPaid && !userApiKey) {
      return NextResponse.json(
        { error: 'payment_required', message: 'Enter your Claude API key to generate insights, or upgrade to a paid plan.' },
        { status: 402 }
      );
    }

    const summary = buildSummary(ideaRows, userStats as UserStats | null);
    const insights = await generateGeneralInsights(summary, userApiKey);
    const generatedAt = new Date().toISOString();

    await supabase
      .from('user_stats')
      .upsert({ user_id: user.id, general_insights: insights, general_insights_generated_at: generatedAt }, { onConflict: 'user_id' });

    return NextResponse.json({ insights, generated_at: generatedAt });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Failed to generate insights' }, { status: 500 });
  }
}

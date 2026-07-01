import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();

  const { data: users } = await supabase
    .from('users')
    .select('id, display_username, full_name, avatar_url')
    .eq('show_on_leaderboard', true);

  if (!users || users.length === 0) return NextResponse.json([]);

  const ids = users.map((u) => u.id);

  const [{ data: statsRows }, { data: ideaRows }] = await Promise.all([
    supabase.from('user_stats').select('user_id, total_conversations, total_code_lines, first_conversation_at').in('user_id', ids),
    supabase.from('ideas').select('user_id').in('user_id', ids),
  ]);

  const statsMap = new Map((statsRows || []).map((s) => [s.user_id, s]));
  const ideaCountMap: Record<string, number> = {};
  (ideaRows || []).forEach((i) => { ideaCountMap[i.user_id] = (ideaCountMap[i.user_id] || 0) + 1; });

  const result = users.map((u) => {
    const s = statsMap.get(u.id);
    const monthsExperience = s?.first_conversation_at
      ? Math.max(0, Math.round((Date.now() - new Date(s.first_conversation_at).getTime()) / (30 * 86400000)))
      : 0;
    return {
      id: u.id,
      username: u.display_username || u.full_name || 'Anonymous',
      avatar_url: u.avatar_url,
      conversations: s?.total_conversations || 0,
      ideas: ideaCountMap[u.id] || 0,
      code_lines: s?.total_code_lines || 0,
      months_experience: monthsExperience,
      is_me: u.id === user.id,
    };
  });

  return NextResponse.json(result);
}

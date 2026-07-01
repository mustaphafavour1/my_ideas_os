import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('display_username, show_on_leaderboard, avatar_url, full_name')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    display_username: data?.display_username ?? null,
    show_on_leaderboard: data?.show_on_leaderboard ?? false,
    avatar_url: data?.avatar_url ?? null,
    full_name: data?.full_name ?? null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { display_username, show_on_leaderboard } = await req.json().catch(() => ({}));
  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (typeof display_username === 'string') {
    const trimmed = display_username.trim();
    if (trimmed.length < 3 || trimmed.length > 24 || !/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: 'Username must be 3-24 characters — letters, numbers, and underscores only.' },
        { status: 400 }
      );
    }
    updates.display_username = trimmed;
  }
  if (typeof show_on_leaderboard === 'boolean') updates.show_on_leaderboard = show_on_leaderboard;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await supabase.from('users').update(updates).eq('id', user.id);
  if (error) {
    const message = error.code === '23505' ? 'That username is already taken.' : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

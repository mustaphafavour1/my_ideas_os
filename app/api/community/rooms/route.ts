import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const [{ data: rooms }, { data: myMemberships }, { data: allMemberships }] = await Promise.all([
    supabase.from('chat_rooms').select('*').order('sort_order', { ascending: true }),
    supabase.from('chat_room_members').select('room_id').eq('user_id', user.id),
    supabase.from('chat_room_members').select('room_id'),
  ]);

  const joinedIds = new Set((myMemberships || []).map((m) => m.room_id));
  const countMap: Record<string, number> = {};
  (allMemberships || []).forEach((m) => { countMap[m.room_id] = (countMap[m.room_id] || 0) + 1; });

  const result = (rooms || []).map((r) => ({
    ...r,
    joined: joinedIds.has(r.id),
    member_count: countMap[r.id] || 0,
  }));

  return NextResponse.json(result);
}

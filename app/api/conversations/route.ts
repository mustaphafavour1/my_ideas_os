import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { ConversationLog, UserStats } from '@/lib/types';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();

  const [{ data: logs }, { data: stats }] = await Promise.all([
    supabase
      .from('conversations_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single(),
  ]);

  return NextResponse.json({
    logs: (logs || []) as ConversationLog[],
    stats: (stats || null) as UserStats | null,
  });
}

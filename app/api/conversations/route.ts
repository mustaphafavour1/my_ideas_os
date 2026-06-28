import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { ConversationLog, UserStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceClient();

  const [{ data: logs }, { data: stats }] = await Promise.all([
    supabase
      .from('conversations_log')
      .select('*')
      .eq('user_id', 'favour')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', 'favour')
      .single(),
  ]);

  return NextResponse.json({
    logs: (logs || []) as ConversationLog[],
    stats: (stats || null) as UserStats | null,
  });
}

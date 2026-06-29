export const dynamic = 'force-dynamic';

import { TopBar } from '@/components/layout/TopBar';
import { ConversationsContent } from '@/components/conversations/ConversationsContent';
import { createServiceClient } from '@/lib/supabase';
import { ConversationLog, UserStats } from '@/lib/types';
import { DEMO_CONVERSATIONS_LOG, DEMO_USER_STATS } from '@/lib/demo-data';

async function getData() {
  const supabase = createServiceClient();
  const [{ data: logs }, { data: stats }, { count: demoCount }] = await Promise.all([
    supabase.from('conversations_log').select('*').eq('user_id', 'favour').order('created_at', { ascending: false }),
    supabase.from('user_stats').select('*').eq('user_id', 'favour').single(),
    supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('user_id', 'favour').eq('source_ref', 'demo_mode'),
  ]);

  const isDemoActive = (demoCount ?? 0) > 0;
  const effectiveLogs = (logs && logs.length > 0)
    ? (logs as ConversationLog[])
    : isDemoActive ? (DEMO_CONVERSATIONS_LOG as unknown as ConversationLog[]) : [];
  const effectiveStats = (stats as UserStats | null) ?? (isDemoActive ? DEMO_USER_STATS : null);

  return { logs: effectiveLogs, stats: effectiveStats };
}

export default async function ConversationsPage() {
  const { logs, stats } = await getData();

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Conversations" subtitle="Your AI conversation history" />
      <ConversationsContent logs={logs} stats={stats} />
    </div>
  );
}

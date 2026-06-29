export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { ConversationsContent } from '@/components/conversations/ConversationsContent';
import { createServiceClient } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { ConversationLog, Idea, UserStats } from '@/lib/types';
import { computeProductivityScore, scoreLabel } from '@/lib/productivity';

async function getData(userId: string) {
  const supabase = createServiceClient();
  const [{ data: logs }, { data: stats }, { data: ideas }] = await Promise.all([
    supabase.from('conversations_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    supabase.from('ideas').select('*').eq('user_id', userId),
  ]);

  const allIdeas = (ideas || []) as Idea[];
  const effectiveStats = stats as UserStats | null;
  const productivityScore = computeProductivityScore(allIdeas, effectiveStats);
  const productivityLbl = scoreLabel(productivityScore);

  return {
    logs: (logs || []) as ConversationLog[],
    stats: effectiveStats,
    productivityScore,
    productivityLabel: productivityLbl,
  };
}

export default async function ConversationsPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const { logs, stats, productivityScore, productivityLabel } = await getData(user.id);

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Conversations" subtitle="Your AI conversation history" />
      <ConversationsContent
        logs={logs}
        stats={stats}
        productivityScore={productivityScore}
        productivityLabel={productivityLabel}
      />
    </div>
  );
}

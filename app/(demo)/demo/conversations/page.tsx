import { TopBar } from '@/components/layout/TopBar';
import { ConversationsContent } from '@/components/conversations/ConversationsContent';
import { DEMO_CONVERSATIONS_LOG, DEMO_USER_STATS, DEMO_IDEAS } from '@/lib/demo-data';
import { computeProductivityScore, scoreLabel } from '@/lib/productivity';
import { Idea } from '@/lib/types';

export default function DemoConversationsPage() {
  const productivityScore = computeProductivityScore(DEMO_IDEAS as unknown as Idea[], DEMO_USER_STATS);
  const productivityLabel = scoreLabel(productivityScore);
  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Conversations" subtitle="Your AI conversation history" />
      <ConversationsContent
        logs={DEMO_CONVERSATIONS_LOG as never}
        stats={DEMO_USER_STATS}
        productivityScore={productivityScore}
        productivityLabel={productivityLabel}
      />
    </div>
  );
}

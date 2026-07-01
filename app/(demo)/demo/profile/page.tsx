import { TopBar } from '@/components/layout/TopBar';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { DEMO_IDEAS, DEMO_USER_STATS } from '@/lib/demo-data';
import { Idea } from '@/lib/types';

const ideas = DEMO_IDEAS as unknown as Idea[];

function topEntries(items: (string | null)[]): { label: string; count: number }[] {
  const counts: Record<string, number> = {};
  items.forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label: label.replace(/_/g, ' '), count }));
}

export default function DemoProfilePage() {
  const completed = ideas.filter((i) => i.status === 'completed').length;
  const inProgress = ideas.filter((i) => i.status === 'in_progress').length;
  const topSectors = topEntries(ideas.map((i) => i.sector));
  const completionPct = ideas.length > 0 ? Math.round((completed / ideas.length) * 100) : 0;

  const firstConvDate = DEMO_USER_STATS.first_conversation_at
    ? new Date(DEMO_USER_STATS.first_conversation_at)
    : null;
  const monthsExp = firstConvDate
    ? Math.max(1, Math.round((Date.now() - firstConvDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
    : null;

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Profile" subtitle="Your AI builder profile · demo data" />
      <ProfileContent
        ideas={ideas}
        stats={DEMO_USER_STATS}
        completed={completed}
        inProgress={inProgress}
        completionPct={completionPct}
        monthsExp={monthsExp}
        topSectors={topSectors}
        initialUsername="demo_builder"
      />
    </div>
  );
}

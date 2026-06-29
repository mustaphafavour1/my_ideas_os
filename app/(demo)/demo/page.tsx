import { TopBar } from '@/components/layout/TopBar';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { DEMO_IDEAS, DEMO_USER_STATS } from '@/lib/demo-data';
import { computeDashboardProps } from '@/lib/dashboard-utils';
import { Idea } from '@/lib/types';

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { range = 'all', from, to } = await searchParams;

  const { lastSynced, ...contentProps } = computeDashboardProps(
    DEMO_IDEAS as unknown as Idea[],
    DEMO_USER_STATS,
    null,
    0,
    range,
    from,
    to,
  );

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Dashboard"
        subtitle={`${contentProps.stats.total} ideas total`}
        lastSynced={lastSynced}
      />
      <DashboardContent {...contentProps} />
    </div>
  );
}

'use client';

import { TopBar } from '@/components/layout/TopBar';
import { IdeaTable } from '@/components/ideas/IdeaTable';
import { DEMO_IDEAS } from '@/lib/demo-data';
import { Idea } from '@/lib/types';

export default function DemoIdeasPage() {
  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Ideas" subtitle={`${DEMO_IDEAS.length} ideas · demo data`} />
      <IdeaTable ideas={DEMO_IDEAS as unknown as Idea[]} baseUrl="/demo/ideas" />
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { StatusChip } from '@/components/ui/StatusChip';
import { Badge } from '@/components/ui/Badge';
import { DEMO_IDEAS } from '@/lib/demo-data';
import { Idea } from '@/lib/types';
import Link from 'next/link';

const ideas = DEMO_IDEAS as unknown as Idea[];

interface ConnectedPair {
  a: Idea; b: Idea;
  score: number; reasons: string[];
}

function findConnectedPairs(ideas: Idea[]): ConnectedPair[] {
  const pairs: ConnectedPair[] = [];
  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const a = ideas[i], b = ideas[j];
      let score = 0;
      const reasons: string[] = [];
      if (a.sector && b.sector && a.sector === b.sector) { score += 3; reasons.push(`${a.sector} sector`); }
      const aTags = a.tags || [], bTags = b.tags || [];
      const shared = aTags.filter((t) => bTags.includes(t));
      if (shared.length > 0) { score += shared.length; reasons.push(`Shared tags: ${shared.slice(0, 2).join(', ')}`); }
      if (a.idea_type && b.idea_type && a.idea_type === b.idea_type) { score += 1; reasons.push(a.idea_type); }
      if (score >= 2) pairs.push({ a, b, score, reasons });
    }
  }
  return pairs.sort((a, b) => b.score - a.score).slice(0, 8);
}

export default function DemoInsightsPage() {
  const pairs = useMemo(() => findConnectedPairs(ideas), []);

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Insights" subtitle={`${pairs.length} connected pairs found`} />
      <main className="flex-1 px-4 lg:px-8 pt-10 pb-10 max-w-4xl mx-auto w-full">
        {pairs.length === 0 ? (
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-16 text-center">
            <p className="text-[12px] text-[#3A3A55] font-mono">No connected pairs found in demo data</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[11px] font-mono text-[#3A3A55] mb-6">Ideas from your demo data that share context, sector, or themes</p>
            {pairs.map((pair, i) => (
              <div key={i} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Link href={`/demo/ideas`} className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white hover:text-[#F7C948] transition-colors truncate">{pair.a.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusChip status={pair.a.status} />
                        {pair.a.sector && <Badge label={pair.a.sector} />}
                      </div>
                    </Link>
                    <div className="text-[#F7C948]/40 text-[18px] shrink-0 mt-1">⟷</div>
                    <Link href={`/demo/ideas`} className="flex-1 min-w-0 text-right">
                      <p className="text-[13px] font-semibold text-white hover:text-[#F7C948] transition-colors truncate">{pair.b.title}</p>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <StatusChip status={pair.b.status} />
                        {pair.b.sector && <Badge label={pair.b.sector} />}
                      </div>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pair.reasons.map((r, ri) => (
                    <span key={ri} className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#F7C948]/8 text-[#F7C948]/60 border border-[#F7C948]/15">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

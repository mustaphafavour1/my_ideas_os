'use client';

import Link from 'next/link';

const RANGES = [
  { label: 'All time', value: 'all' },
  { label: '1Y', value: '1y' },
  { label: '90D', value: '90d' },
  { label: '30D', value: '30d' },
  { label: '7D', value: '7d' },
];

export function AnalyticsFilters({ currentRange }: { currentRange: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {RANGES.map(({ label, value }) => (
        <Link
          key={value}
          href={value === 'all' ? '/analytics' : `/analytics?range=${value}`}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-colors ${
            currentRange === value
              ? 'bg-[#F7C948]/15 text-[#F7C948] border border-[#F7C948]/30'
              : 'text-[#4A4A60] hover:text-[#8888A0] border border-transparent hover:border-[#1E1E2E]'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

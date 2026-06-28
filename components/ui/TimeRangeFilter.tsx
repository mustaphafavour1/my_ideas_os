'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

const RANGE_OPTIONS = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'This quarter', value: 'quarter' },
  { label: 'This year', value: 'year' },
  { label: 'Custom range', value: 'custom' },
];

interface TimeRangeFilterProps {
  currentRange: string;
  currentFrom?: string;
  currentTo?: string;
}

export function TimeRangeFilter({ currentRange, currentFrom = '', currentTo = '' }: TimeRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [range, setRange] = useState(currentRange);
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  const push = (r: string, f?: string, t?: string) => {
    const params = new URLSearchParams();
    if (r !== 'all') params.set('range', r);
    if (r === 'custom' && f) params.set('from', f);
    if (r === 'custom' && t) params.set('to', t);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const r = e.target.value;
    setRange(r);
    if (r !== 'custom') push(r);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={range}
        onChange={handleRangeChange}
        className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-1.5 text-[11px] font-mono text-[#8888A0] focus:outline-none focus:border-[#F7C948]/30 transition-colors cursor-pointer"
      >
        {RANGE_OPTIONS.map(({ label, value }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {range === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-2 py-1.5 text-[11px] font-mono text-[#8888A0] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
          />
          <span className="text-[10px] text-[#3A3A55] font-mono">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-2 py-1.5 text-[11px] font-mono text-[#8888A0] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
          />
          <button
            onClick={() => push('custom', from, to)}
            disabled={!from || !to}
            className="text-[10px] font-mono text-[#F7C948] hover:text-[#E6B830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-1"
          >
            Apply →
          </button>
        </div>
      )}
    </div>
  );
}

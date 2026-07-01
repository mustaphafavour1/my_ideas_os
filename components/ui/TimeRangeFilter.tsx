'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';

const GRANULARITY_OPTIONS = [
  { label: 'All-time', value: 'all' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom range', value: 'custom' },
];

const UNIT_LABEL: Record<string, string> = {
  daily: 'day', weekly: 'week', monthly: 'month', quarterly: 'quarter', yearly: 'year',
};
const CURRENT_LABEL: Record<string, string> = {
  daily: 'Today', weekly: 'This week', monthly: 'This month', quarterly: 'This quarter', yearly: 'This year',
};

function offsetLabel(granularity: string, offset: number): string {
  if (offset === 0) return CURRENT_LABEL[granularity] || 'Current';
  const unit = UNIT_LABEL[granularity] || 'period';
  if (offset === 1) return granularity === 'daily' ? 'Yesterday' : `Last ${unit}`;
  return `${offset} ${unit}s ago`;
}

const OFFSET_OPTIONS = [0, 1, 2];

interface TimeRangeFilterProps {
  currentRange: string;
  currentFrom?: string;
  currentTo?: string;
  currentOffset?: string;
  onPendingChange?: (pending: boolean) => void;
}

export function TimeRangeFilter({
  currentRange, currentFrom = '', currentTo = '', currentOffset = '0', onPendingChange,
}: TimeRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [range, setRange] = useState(currentRange);
  const [offset, setOffset] = useState(currentOffset);
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { onPendingChange?.(isPending); }, [isPending, onPendingChange]);

  const push = (r: string, opts: { off?: string; f?: string; t?: string } = {}) => {
    const params = new URLSearchParams();
    if (r !== 'all') params.set('range', r);
    if (['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(r) && opts.off && opts.off !== '0') {
      params.set('offset', opts.off);
    }
    if (r === 'custom' && opts.f) params.set('from', opts.f);
    if (r === 'custom' && opts.t) params.set('to', opts.t);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const r = e.target.value;
    setRange(r);
    setOffset('0');
    if (r !== 'custom') push(r, { off: '0' });
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const off = e.target.value;
    setOffset(off);
    push(range, { off });
  };

  const isPeriodGranularity = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(range);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <select
          value={range}
          onChange={handleRangeChange}
          disabled={isPending}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg pl-3 pr-3 py-1.5 text-[11px] font-mono text-[#8888A0] focus:outline-none focus:border-[#F7C948]/30 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {GRANULARITY_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {isPending && (
          <span className="absolute -right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 border-2 border-[#F7C948]/30 border-t-[#F7C948] rounded-full animate-spin" />
        )}
      </div>

      {isPeriodGranularity && (
        <select
          value={offset}
          onChange={handleOffsetChange}
          disabled={isPending}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-1.5 text-[11px] font-mono text-[#8888A0] focus:outline-none focus:border-[#F7C948]/30 transition-colors cursor-pointer disabled:opacity-60"
        >
          {OFFSET_OPTIONS.map((o) => (
            <option key={o} value={o}>{offsetLabel(range, o)}</option>
          ))}
        </select>
      )}

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
            onClick={() => push('custom', { f: from, t: to })}
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

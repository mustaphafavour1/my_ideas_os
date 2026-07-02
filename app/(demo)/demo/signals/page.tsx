'use client';

import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { DEMO_SIGNALS } from '@/lib/demo-data';
import { SignalType } from '@/lib/types';

const TYPE_CONFIG: Record<SignalType, { label: string; dot: string }> = {
  strategy:    { label: 'Strategy',    dot: '#F7C948' },
  pattern:     { label: 'Pattern',     dot: '#9B6BD5' },
  principle:   { label: 'Principle',   dot: '#5B9BD5' },
  opportunity: { label: 'Opportunity', dot: '#3AB870' },
  risk:        { label: 'Risk',        dot: '#C06830' },
  lesson:      { label: 'Lesson',      dot: '#4ABDBD' },
};

const SIGNAL_TYPES: SignalType[] = ['strategy', 'pattern', 'principle', 'opportunity', 'risk', 'lesson'];

export default function DemoSignalsPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState<SignalType | ''>('');

  const filtered = useMemo(() => {
    return DEMO_SIGNALS.filter((s) => {
      if (typeFilter && s.signal_type !== typeFilter) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
          !s.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, typeFilter]);

  const byType = useMemo(() => {
    const groups: Partial<Record<SignalType, typeof DEMO_SIGNALS>> = {};
    filtered.forEach((s) => {
      if (!groups[s.signal_type]) groups[s.signal_type] = [];
      groups[s.signal_type]!.push(s);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Signals" subtitle={`${DEMO_SIGNALS.length} extracted signals · demo data`} />
      <main className="flex-1 px-4 lg:px-8 py-8 max-w-5xl mx-auto w-full space-y-8">

        <div className="bg-[#F7C948]/5 border border-[#F7C948]/15 rounded-xl p-5">
          <p className="text-[11px] font-mono text-[#F7C948]/70 uppercase tracking-widest mb-1.5">Demo Signals</p>
          <p className="text-[12px] text-[#7A7A90] leading-relaxed">
            Signals are strategies, patterns, and principles extracted from your ideas.
            Open any idea and click <strong className="text-[#D0D0DA]">Save Signal</strong> to build your personal playbook.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
              placeholder="Search… press Enter"
              className="bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-9 py-2 text-[12px] text-[#F0F0F5] placeholder-white/20 focus:outline-none focus:border-[#F7C948]/30 w-48 transition-colors"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter('')}
              className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-colors ${typeFilter === '' ? 'border-[#F7C948]/30 text-[#F7C948] bg-[#F7C948]/8' : 'border-[#1E1E2E] text-white/30 hover:border-[#2A2A3A]'}`}
            >
              All
            </button>
            {SIGNAL_TYPES.map((t) => {
              const cfg = TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                  className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-colors"
                  style={typeFilter === t
                    ? { color: cfg.dot, borderColor: `${cfg.dot}30`, backgroundColor: `${cfg.dot}10` }
                    : { color: 'rgba(255,255,255,0.3)', borderColor: '#1E1E2E' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] font-mono text-white/30 ml-auto">
            {filtered.length} signal{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[12px] text-white/30 font-mono">No signals match your filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {SIGNAL_TYPES.filter((t) => byType[t]?.length).map((type) => {
              const cfg = TYPE_CONFIG[type];
              const signals = byType[type]!;
              return (
                <section key={type}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                    <h2 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: cfg.dot }}>{cfg.label}</h2>
                    <span className="text-[10px] font-mono text-white/30">({signals.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {signals.map((signal) => (
                      <div key={signal.id} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 hover:border-[#252535] transition-colors">
                        <h3 className="text-[13px] font-semibold text-[#D0D0DA] leading-snug mb-2">{signal.title}</h3>
                        <p className="text-[12px] text-[#6A6A80] leading-relaxed">{signal.content}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[9px] font-mono text-white/20">
                            {new Date(signal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[8px] font-mono" style={{ color: cfg.dot }}>{cfg.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}

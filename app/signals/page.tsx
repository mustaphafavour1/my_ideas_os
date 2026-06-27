'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { Signal, SignalType } from '@/lib/types';
import Link from 'next/link';
import { toast } from 'sonner';

const TYPE_CONFIG: Record<SignalType, { label: string; dot: string; text: string }> = {
  strategy:    { label: 'Strategy',    dot: '#F7C948', text: '#F7C948' },
  pattern:     { label: 'Pattern',     dot: '#9B6BD5', text: '#9B6BD5' },
  principle:   { label: 'Principle',   dot: '#5B9BD5', text: '#5B9BD5' },
  opportunity: { label: 'Opportunity', dot: '#3AB870', text: '#3AB870' },
  risk:        { label: 'Risk',        dot: '#C06830', text: '#C06830' },
  lesson:      { label: 'Lesson',      dot: '#4ABDBD', text: '#4ABDBD' },
};

const SIGNAL_TYPES: SignalType[] = ['strategy', 'pattern', 'principle', 'opportunity', 'risk', 'lesson'];

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SignalType | ''>('');
  const [error, setError] = useState('');

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signals');
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to load signals');
        return;
      }
      const data = await res.json();
      setSignals(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to connect — check your signals table is set up in Supabase');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/signals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSignals((prev) => prev.filter((s) => s.id !== id));
      toast.success('Signal removed');
    } else {
      toast.error('Failed to remove signal');
    }
  };

  const filtered = useMemo(() => {
    return signals.filter((s) => {
      if (typeFilter && s.signal_type !== typeFilter) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
          !s.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [signals, search, typeFilter]);

  const byType = useMemo(() => {
    const groups: Partial<Record<SignalType, Signal[]>> = {};
    filtered.forEach((s) => {
      if (!groups[s.signal_type]) groups[s.signal_type] = [];
      groups[s.signal_type]!.push(s);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Signals"
        subtitle={`${signals.length} extracted signal${signals.length !== 1 ? 's' : ''}`}
      />

      <main className="flex-1 px-4 lg:px-8 py-8 max-w-5xl mx-auto w-full space-y-8">
        {/* How to use */}
        {signals.length === 0 && !loading && !error && (
          <div className="bg-[#F7C948]/5 border border-[#F7C948]/15 rounded-xl p-6">
            <p className="text-[11px] font-mono text-[#F7C948]/70 uppercase tracking-widest mb-2">Getting Started</p>
            <p className="text-[12px] text-[#7A7A90] leading-relaxed">
              Signals are strategies, patterns, and principles you extract from your ideas.
              Open any idea and click <strong className="text-[#D0D0DA]">Save Signal</strong> to start building your personal playbook.
            </p>
          </div>
        )}

        {/* Filters */}
        {signals.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search signals…"
                className="bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-3 py-2 text-[12px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 w-48 transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3A3A55]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setTypeFilter('')}
                className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-colors ${typeFilter === '' ? 'border-[#F7C948]/30 text-[#F7C948] bg-[#F7C948]/8' : 'border-[#1E1E2E] text-[#3A3A55] hover:border-[#2A2A3A]'}`}
              >
                All
              </button>
              {SIGNAL_TYPES.map((t) => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                    className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-colors ${typeFilter === t ? 'border-current/30 bg-current/8' : 'border-[#1E1E2E] text-[#3A3A55] hover:border-[#2A2A3A]'}`}
                    style={typeFilter === t ? { color: cfg.dot, borderColor: `${cfg.dot}30`, backgroundColor: `${cfg.dot}10` } : {}}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] font-mono text-[#3A3A55] ml-auto">
              {filtered.length} signal{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-[#111118] border border-[#C06830]/30 rounded-xl p-6">
            <p className="text-[12px] text-[#C06830] font-mono mb-3">{error}</p>
            <p className="text-[11px] text-[#5E5E7A] leading-relaxed">
              Run this SQL in your Supabase dashboard to set up the signals table:
            </p>
            <pre className="mt-3 bg-[#0A0A0F] rounded-lg p-4 text-[10px] font-mono text-[#6A6A80] overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'favour',
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  signal_type TEXT NOT NULL DEFAULT 'strategy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
            </pre>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-[#111118] border border-[#1E1E2E] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Grouped signals */}
        {!loading && !error && (
          <AnimatePresence>
            {filtered.length === 0 && signals.length > 0 ? (
              <div className="py-16 text-center">
                <p className="text-[12px] text-[#3A3A55] font-mono">No signals match your filters</p>
              </div>
            ) : (
              <div className="space-y-8">
                {typeFilter ? (
                  <SignalGroup type={typeFilter} signals={filtered} onDelete={handleDelete} />
                ) : (
                  SIGNAL_TYPES.filter((t) => byType[t]?.length).map((t) => (
                    <SignalGroup key={t} type={t} signals={byType[t]!} onDelete={handleDelete} />
                  ))
                )}
              </div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

function SignalGroup({ type, signals, onDelete }: { type: SignalType; signals: Signal[]; onDelete: (id: string) => void }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
        <h2 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: cfg.text }}>{cfg.label}</h2>
        <span className="text-[10px] font-mono text-[#3A3A55]">({signals.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {signals.map((signal, i) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 group hover:border-[#252535] transition-colors relative"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-[13px] font-semibold text-[#D0D0DA] leading-snug">{signal.title}</h3>
              <button
                onClick={() => onDelete(signal.id)}
                className="opacity-0 group-hover:opacity-100 text-[#3A3A55] hover:text-[#C06830] transition-all shrink-0 mt-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-[12px] text-[#6A6A80] leading-relaxed mb-3">{signal.content}</p>
            {signal.idea_title && (
              <Link
                href={signal.idea_id ? `/ideas/${signal.idea_id}` : '#'}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-[#3A3A55] hover:text-[#6A6A80] transition-colors"
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {signal.idea_title}
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

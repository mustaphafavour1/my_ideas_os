'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { LeaderboardEntry } from '@/lib/types';
import { MeProfile } from './CommunityContent';

type SortKey = 'conversations' | 'ideas' | 'code_lines' | 'months_experience';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'conversations', label: 'Conversations' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'code_lines', label: 'Code lines' },
  { value: 'months_experience', label: 'Months of experience' },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function Leaderboard({ me }: { me: MeProfile }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('ideas');

  const [username, setUsername] = useState(me.display_username || '');
  const [visible, setVisible] = useState(me.show_on_leaderboard);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    const run = () => {
      setLoading(true);
      fetch('/api/community/leaderboard')
        .then((r) => r.json())
        .then((d) => { setEntries(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    };
    run();
  }, []);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b[sortKey] - a[sortKey]),
    [entries, sortKey]
  );

  const saveSettings = async () => {
    setSaving(true);
    setSettingsError('');
    try {
      const res = await fetch('/api/account/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_username: username, show_on_leaderboard: visible }),
      });
      const data = await res.json();
      if (!res.ok) { setSettingsError(data.error || 'Could not save.'); return; }
      toast.success('Leaderboard settings saved');
      if (visible) {
        const r = await fetch('/api/community/leaderboard');
        setEntries(await r.json());
      }
    } catch {
      setSettingsError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Settings */}
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
        <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-3">Your leaderboard settings</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Display username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. builder_favour"
              maxLength={24}
              className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-lg px-3 py-2 text-[12px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/40 transition-colors"
            />
          </div>
          <button
            onClick={() => setVisible((v) => !v)}
            className={`h-[38px] px-3 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
              visible ? 'border-[#4ADE80]/30 text-[#4ADE80] bg-[#4ADE80]/5' : 'border-[#1E1E2E] text-white/40'
            }`}
          >
            {visible ? 'Visible on leaderboard' : 'Hidden from leaderboard'}
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || !username.trim()}
            className="h-[38px] px-4 rounded-lg bg-[#F7C948] text-[#0A0A0F] text-[12px] font-bold hover:bg-[#E6B830] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {settingsError && <p className="text-[11px] text-[#F87171] mt-2">{settingsError}</p>}
        <p className="text-[10px] text-white/25 mt-2">3-24 characters — letters, numbers, and underscores only.</p>
      </div>

      {/* Sort control */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Top builders</p>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-1.5 text-[11px] font-mono text-[#8888A0] focus:outline-none focus:border-[#F7C948]/30 cursor-pointer transition-colors"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Sort by {o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-5 h-5 border-2 border-[#F7C948]/30 border-t-[#F7C948] rounded-full animate-spin mx-auto" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[12px] text-white/30 font-mono">No one&apos;s on the leaderboard yet — be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A28]">
            {sorted.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 px-5 py-3.5 ${entry.is_me ? 'bg-[#F7C948]/[0.03]' : ''}`}
              >
                <span className={`text-[12px] font-mono w-6 shrink-0 ${i < 3 ? 'text-[#F7C948]' : 'text-white/30'}`}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-[#1E1E2E] flex items-center justify-center shrink-0 overflow-hidden">
                  {entry.avatar_url
                    ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[10px] text-white/40">{entry.username.slice(0, 1).toUpperCase()}</span>}
                </div>
                <span className="text-[12px] font-medium text-[#E8E8F0] flex-1 truncate">
                  {entry.username}{entry.is_me && <span className="text-white/30 ml-1.5">(you)</span>}
                </span>
                <span className="text-[11px] font-mono text-white/50 w-16 text-right">{fmt(entry.conversations)}</span>
                <span className="text-[11px] font-mono text-white/50 w-14 text-right">{fmt(entry.ideas)}</span>
                <span className="text-[11px] font-mono text-white/50 w-16 text-right hidden sm:block">{fmt(entry.code_lines)}</span>
                <span className="text-[11px] font-mono text-white/50 w-12 text-right hidden sm:block">{entry.months_experience}mo</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

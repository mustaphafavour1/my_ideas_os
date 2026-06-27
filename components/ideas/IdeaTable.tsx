'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Idea, IdeaStatus, IdeaType } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { GradeRing } from '@/components/ui/GradeRing';
import { Button } from '@/components/ui/Button';

const STATUSES: IdeaStatus[] = [
  'captured', 'lightly_researched', 'prototyping', 'validated',
  'in_progress', 'paused', 'completed', 'archived',
];

const TYPES: IdeaType[] = [
  'product', 'side_quest', 'portfolio', 'content', 'strategy', 'research',
  'personal_development', 'automation', 'community', 'framework', 'experiment', 'partnership',
];

interface IdeaTableProps {
  ideas: Idea[];
  onAddIdea?: () => void;
}

export function IdeaTable({ ideas, onAddIdea }: IdeaTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<'created_at' | 'grade_overall' | 'title'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = ideas
    .filter((i) => {
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()) &&
          !(i.description || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      if (typeFilter && i.idea_type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let av: string | number | null = sortKey === 'title' ? a.title : sortKey === 'grade_overall' ? (a.grade_overall ?? 0) : a.created_at;
      let bv: string | number | null = sortKey === 'title' ? b.title : sortKey === 'grade_overall' ? (b.grade_overall ?? 0) : b.created_at;
      if (av === null) av = '';
      if (bv === null) bv = '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) => (
    <span className={`ml-1 text-[10px] ${sortKey === k ? 'text-[#F7C948]' : 'text-[#4A4A60]'}`}>
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search ideas…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] placeholder-[#4A4A60] focus:outline-none focus:border-[#F7C948]/40 w-48 lg:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#8888A0] focus:outline-none focus:border-[#F7C948]/40"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#8888A0] focus:outline-none focus:border-[#F7C948]/40"
        >
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <span className="text-xs text-[#4A4A60] font-mono ml-auto">{filtered.length} idea{filtered.length !== 1 ? 's' : ''}</span>
        {onAddIdea && (
          <Button size="sm" onClick={onAddIdea}>+ Add Idea</Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1E1E2E]">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-[#1E1E2E] bg-[#0D0D14]">
              <th
                className="text-left px-4 py-3 text-[#4A4A60] font-mono text-xs uppercase tracking-wide cursor-pointer hover:text-[#8888A0] sticky left-0 bg-[#0D0D14] min-w-[200px]"
                onClick={() => toggleSort('title')}
              >
                Title <SortIcon k="title" />
              </th>
              <th className="text-left px-3 py-3 text-[#4A4A60] font-mono text-xs uppercase tracking-wide">Type</th>
              <th className="text-left px-3 py-3 text-[#4A4A60] font-mono text-xs uppercase tracking-wide">Sector</th>
              <th className="text-left px-3 py-3 text-[#4A4A60] font-mono text-xs uppercase tracking-wide">Status</th>
              <th
                className="text-left px-3 py-3 text-[#4A4A60] font-mono text-xs uppercase tracking-wide cursor-pointer hover:text-[#8888A0]"
                onClick={() => toggleSort('grade_overall')}
              >
                Grade <SortIcon k="grade_overall" />
              </th>
              <th className="text-left px-3 py-3 text-[#4A4A60] font-mono text-xs uppercase tracking-wide">Steps</th>
              <th className="text-left px-3 py-3 text-[#4A4A60] font-mono text-xs uppercase tracking-wide">Blockers</th>
              <th
                className="text-left px-3 py-3 text-[#4A4A60] font-mono text-xs uppercase tracking-wide cursor-pointer hover:text-[#8888A0]"
                onClick={() => toggleSort('created_at')}
              >
                Date <SortIcon k="created_at" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#4A4A60] text-sm">
                  {ideas.length === 0
                    ? 'No ideas yet — run a sync or add one manually'
                    : 'No ideas match your filters'}
                </td>
              </tr>
            ) : (
              filtered.map((idea) => (
                <tr
                  key={idea.id}
                  className="border-b border-[#1E1E2E] hover:bg-[#111118] cursor-pointer transition-colors"
                  onClick={() => router.push(`/ideas/${idea.id}`)}
                >
                  <td className="px-4 py-3 sticky left-0 bg-[#0A0A0F] hover:bg-[#111118]">
                    <span className="text-[#F0F0F5] font-medium line-clamp-1">{idea.title}</span>
                  </td>
                  <td className="px-3 py-3">
                    {idea.idea_type ? <Badge type={idea.idea_type} size="sm" /> : <span className="text-[#4A4A60]">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-[#8888A0] font-mono">{idea.sector || '—'}</span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusChip status={idea.status} size="sm" />
                  </td>
                  <td className="px-3 py-3">
                    <GradeRing grade={idea.grade_overall} size="sm" />
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-mono text-[#8888A0]">{idea.next_steps?.length ?? 0}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-mono ${idea.blockers?.length ? 'text-[#FB923C]' : 'text-[#4A4A60]'}`}>
                      {idea.blockers?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-mono text-[#4A4A60]">
                      {new Date(idea.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

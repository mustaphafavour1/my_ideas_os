'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Idea, IdeaStatus, IdeaType } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { GradeRing } from '@/components/ui/GradeRing';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

const STATUSES: IdeaStatus[] = [
  'captured', 'lightly_researched', 'prototyping', 'validated',
  'in_progress', 'paused', 'completed', 'archived',
];

const TYPES: IdeaType[] = [
  'product', 'side_quest', 'portfolio', 'content', 'strategy', 'research',
  'personal_development', 'automation', 'community', 'framework', 'experiment', 'partnership',
];

function StatusSelect({ ideaId, status, onUpdate }: { ideaId: string; status: IdeaStatus; onUpdate: (s: IdeaStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePick = async (s: IdeaStatus) => {
    if (s === status) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s }),
      });
      if (res.ok) {
        onUpdate(s);
        toast.success(`→ ${s.replace(/_/g, ' ')}`);
      } else {
        toast.error('Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className="flex items-center gap-1 group rounded px-1 py-0.5 hover:bg-[#1A1A28] transition-colors disabled:opacity-40"
      >
        <StatusChip status={status} size="sm" />
        <svg
          className="w-2.5 h-2.5 text-[#3A3A55] group-hover:text-[#5E5E7A] transition-colors"
          viewBox="0 0 8 8"
          fill="currentColor"
        >
          <path d="M4 5.5L1 2.5h6L4 5.5z" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          />
          <div className="absolute z-50 top-full left-0 mt-1 min-w-[140px] bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handlePick(s)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#1A1A25] ${
                  s === status ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                <StatusChip status={s} size="sm" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface IdeaTableProps {
  ideas: Idea[];
  onAddIdea?: () => void;
}

export function IdeaTable({ ideas: initialIdeas, onAddIdea }: IdeaTableProps) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<'created_at' | 'grade_overall' | 'title'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleStatusUpdate = (ideaId: string, newStatus: IdeaStatus) => {
    setIdeas((prev) => prev.map((i) => i.id === ideaId ? { ...i, status: newStatus } : i));
  };

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
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) => (
    <span className={`ml-1 text-[9px] ${sortKey === k ? 'text-[#F7C948]' : 'text-[#3A3A55]'}`}>
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
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-[12px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 w-48 lg:w-64 transition-colors"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-[12px] text-[#5E5E7A] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-[12px] text-[#5E5E7A] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
        >
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <span className="text-[11px] text-[#3A3A55] font-mono ml-auto">
          {filtered.length} idea{filtered.length !== 1 ? 's' : ''}
        </span>
        {onAddIdea && (
          <Button size="sm" onClick={onAddIdea}>+ Add Idea</Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1E1E2E]">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#1E1E2E] bg-[#0D0D14]">
              <th
                className="text-left px-5 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:text-[#6A6A80] sticky left-0 bg-[#0D0D14] min-w-[200px] transition-colors"
                onClick={() => toggleSort('title')}
              >
                Title <SortIcon k="title" />
              </th>
              <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest">Type</th>
              <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest">Sector</th>
              <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest">Status</th>
              <th
                className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:text-[#6A6A80] transition-colors"
                onClick={() => toggleSort('grade_overall')}
              >
                Grade <SortIcon k="grade_overall" />
              </th>
              <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest">Steps</th>
              <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest">Blocks</th>
              <th
                className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:text-[#6A6A80] transition-colors"
                onClick={() => toggleSort('created_at')}
              >
                Date <SortIcon k="created_at" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center text-[#3A3A55] text-[12px]">
                  {ideas.length === 0
                    ? 'No ideas yet — run a sync or add one manually'
                    : 'No ideas match your filters'}
                </td>
              </tr>
            ) : (
              filtered.map((idea) => (
                <tr
                  key={idea.id}
                  className="border-b border-[#1E1E2E]/60 hover:bg-[#0F0F18] cursor-pointer transition-colors"
                  onClick={() => router.push(`/ideas/${idea.id}`)}
                >
                  <td className="px-5 py-4 sticky left-0 bg-[#0A0A0F] group-hover:bg-[#0F0F18]">
                    <span className="text-[13px] text-[#E0E0EA] font-medium line-clamp-1 leading-snug">{idea.title}</span>
                    {idea.description && (
                      <span className="text-[11px] text-[#4A4A60] line-clamp-1 leading-snug mt-0.5 block">
                        {idea.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {idea.idea_type ? <Badge type={idea.idea_type} size="sm" /> : <span className="text-[#3A3A55] text-[11px] font-mono">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] text-[#5E5E7A] font-mono capitalize">{idea.sector || '—'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusSelect
                      ideaId={idea.id}
                      status={idea.status}
                      onUpdate={(s) => handleStatusUpdate(idea.id, s)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <GradeRing grade={idea.grade_overall} size="sm" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] font-mono text-[#5E5E7A]">{idea.next_steps?.length ?? 0}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[11px] font-mono ${idea.blockers?.length ? 'text-[#C06830]' : 'text-[#3A3A55]'}`}>
                      {idea.blockers?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] font-mono text-[#3A3A55]">
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

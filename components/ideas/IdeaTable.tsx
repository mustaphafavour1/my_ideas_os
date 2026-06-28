'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Idea, IdeaStatus, IdeaType } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { GradeRing } from '@/components/ui/GradeRing';
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
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className="flex items-center gap-1 group rounded pl-1.5 pr-3 py-0.5 hover:bg-[#1A1A28] transition-colors disabled:opacity-40"
      >
        <StatusChip status={status} size="sm" />
        <svg className="w-2.5 h-2.5 text-[#2A2A40] group-hover:text-[#5E5E7A] transition-colors" viewBox="0 0 8 8" fill="currentColor">
          <path d="M4 5.5L1 2.5h6L4 5.5z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute z-50 top-full left-0 mt-1 min-w-[150px] bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handlePick(s)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#1A1A25] transition-colors ${s === status ? 'opacity-30 pointer-events-none' : ''}`}
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

function printReport(idea: Idea) {
  const grades = [
    ['Novelty', idea.grade_novelty],
    ['Feasibility', idea.grade_feasibility],
    ['Personal Fit', idea.grade_personal_fit],
    ['Market Potential', idea.grade_market_potential],
    ['Urgency', idea.grade_urgency],
    ['Overall', idea.grade_overall],
  ];
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${idea.title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;color:#1a1a2e;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.6}h1{font-size:26px;font-weight:700;margin-bottom:6px}.meta{font-size:12px;color:#666;font-family:monospace;margin-bottom:32px;display:flex;gap:16px;flex-wrap:wrap}.badge{background:#f0f0f5;padding:2px 8px;border-radius:4px}h2{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#888;margin:28px 0 10px;border-top:1px solid #e8e8f0;padding-top:16px}p,li{font-size:14px;color:#333}ul{padding-left:20px}li{margin-bottom:4px}.grades{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0}.grade-item{background:#f8f8fc;border-radius:8px;padding:12px;text-align:center}.grade-val{font-size:22px;font-weight:700;color:#1a1a2e}.grade-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-top:2px}.suggestion{background:#fffdf0;border-left:3px solid #f7c948;padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:#555}.footer{margin-top:40px;font-size:11px;color:#aaa;font-family:monospace;border-top:1px solid #e8e8f0;padding-top:16px}</style>
</head><body><h1>${idea.title}</h1><div class="meta">
${idea.status ? `<span class="badge">${idea.status.replace(/_/g, ' ')}</span>` : ''}
${idea.idea_type ? `<span class="badge">${idea.idea_type.replace(/_/g, ' ')}</span>` : ''}
${idea.sector ? `<span class="badge">${idea.sector}</span>` : ''}
<span>Overall Grade: ${idea.grade_overall ?? '—'}/5</span></div>
${idea.description ? `<h2>Description</h2><p>${idea.description}</p>` : ''}
<h2>Grades</h2><div class="grades">${grades.map(([l, v]) => `<div class="grade-item"><div class="grade-val">${v ?? '—'}</div><div class="grade-label">${l}</div></div>`).join('')}</div>
${(idea.next_steps?.length ?? 0) > 0 ? `<h2>Next Steps</h2><ul>${idea.next_steps.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
${(idea.blockers?.length ?? 0) > 0 ? `<h2>Blockers</h2><ul>${idea.blockers.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
${idea.ai_suggestions ? `<h2>AI Suggestion</h2><div class="suggestion">${idea.ai_suggestions}</div>` : ''}
<div class="footer">Idea OS · ${new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}</div>
<script>window.onload=()=>window.print();</script></body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

function ActionsMenu({ idea, onArchive }: { idea: Idea; onArchive: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#3A3A55] hover:text-[#8888A0] hover:bg-[#1A1A28] transition-colors"
        title="Actions"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 right-0 top-full mt-1 w-40 bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl">
            <button
              onClick={() => { setOpen(false); printReport(idea); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[11px] text-[#8888A0] hover:bg-[#1A1A25] hover:text-[#D0D0DA] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export PDF
            </button>
            {idea.status !== 'archived' && (
              <button
                onClick={() => { setOpen(false); onArchive(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[11px] text-[#C06830] hover:bg-[#1A1A25] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface ColumnVisibility {
  type: boolean;
  sector: boolean;
  grade: boolean;
  workBegan: boolean;
  lastWorked: boolean;
}

const DEFAULT_COLS: ColumnVisibility = { type: true, sector: true, grade: true, workBegan: true, lastWorked: true };

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPaginationPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

interface IdeaTableProps {
  ideas: Idea[];
}

export function IdeaTable({ ideas: initialIdeas }: IdeaTableProps) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<'updated_at' | 'grade_overall' | 'title'>('updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [cols, setCols] = useState<ColumnVisibility>(DEFAULT_COLS);

  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, sortKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ideas-os-settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.table?.columns) setCols((c) => ({ ...c, ...parsed.table.columns }));
      }
    } catch {}
  }, []);

  const handleStatusUpdate = (ideaId: string, newStatus: IdeaStatus) => {
    setIdeas((prev) => prev.map((i) => i.id === ideaId ? { ...i, status: newStatus } : i));
  };

  const handleArchive = async (idea: Idea) => {
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    if (res.ok) {
      setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, status: 'archived' } : i));
      toast.success('Archived');
    }
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
      let av: string | number | null = sortKey === 'title' ? a.title : sortKey === 'grade_overall' ? (a.grade_overall ?? 0) : a.updated_at;
      let bv: string | number | null = sortKey === 'title' ? b.title : sortKey === 'grade_overall' ? (b.grade_overall ?? 0) : b.updated_at;
      if (av === null) av = '';
      if (bv === null) bv = '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const colSpan = 4 + [cols.type, cols.sector, cols.grade, cols.workBegan, cols.lastWorked].filter(Boolean).length;

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) => (
    <span className={`ml-1 text-[9px] ${sortKey === k ? 'text-[#F7C948]' : 'text-[#2A2A40]'}`}>
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search ideas… Enter to search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
            className="bg-[#111118] border border-[#1E1E2E] rounded-lg pl-3 pr-9 py-2 text-[12px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 w-48 lg:w-64 transition-colors"
          />
          <button
            onClick={() => setSearch(searchInput)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3A3A55] hover:text-[#8888A0] transition-colors"
          >
            {searchInput ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>
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
        <span className="text-[10px] text-[#3A3A55] font-mono ml-auto">
          {filtered.length} of {ideas.length}
        </span>
      </div>

      {/* Table — always horizontally scrollable */}
      <div className="overflow-x-auto rounded-xl border border-[#1E1E2E]">
        <table className="w-full" style={{ minWidth: '980px' }}>
          <thead>
            <tr className="border-b border-[#1E1E2E] bg-[#0D0D14]">
              <th className="text-left px-5 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ width: '44px' }}>#</th>
              <th
                className="text-left px-5 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:text-[#6A6A80] transition-colors whitespace-nowrap"
                style={{ minWidth: '200px' }}
                onClick={() => toggleSort('title')}
              >
                Title <SortIcon k="title" />
              </th>
              {cols.type      && <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '110px' }}>Type</th>}
              {cols.sector    && <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '100px' }}>Sector</th>}
              <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '140px' }}>Status</th>
              {cols.grade     && (
                <th
                  className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:text-[#6A6A80] transition-colors whitespace-nowrap"
                  style={{ minWidth: '70px' }}
                  onClick={() => toggleSort('grade_overall')}
                >
                  Grade <SortIcon k="grade_overall" />
                </th>
              )}
              {cols.workBegan  && <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '100px' }}>Work Began</th>}
              {cols.lastWorked && (
                <th
                  className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:text-[#6A6A80] transition-colors whitespace-nowrap"
                  style={{ minWidth: '110px' }}
                  onClick={() => toggleSort('updated_at')}
                >
                  Last Updated <SortIcon k="updated_at" />
                </th>
              )}
              <th className="text-left px-4 py-3.5 text-[#3A3A55] font-mono text-[10px] uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-5 py-16 text-center text-[#3A3A55] text-[11px] font-mono">
                  {ideas.length === 0 ? 'No ideas yet — run a sync or add one manually' : 'No ideas match your filters'}
                </td>
              </tr>
            ) : (
              paginated.map((idea, idx) => (
                <tr
                  key={idea.id}
                  className="border-b border-[#1E1E2E]/50 hover:bg-[#0F0F18] cursor-pointer transition-colors"
                  onClick={() => router.push(`/ideas/${idea.id}`)}
                >
                  <td className="px-5 py-4 text-[10px] font-mono text-[#3A3A55] tabular-nums">{(page - 1) * perPage + idx + 1}</td>
                  <td className="px-5 py-4">
                    <span className="text-[12px] text-[#E0E0EA] font-medium whitespace-nowrap overflow-hidden text-ellipsis block max-w-[240px]">{idea.title}</span>
                    {idea.description && (
                      <span className="text-[10px] text-[#3A3A55] font-mono whitespace-nowrap overflow-hidden text-ellipsis block max-w-[240px]">
                        {idea.description}
                      </span>
                    )}
                  </td>
                  {cols.type && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      {idea.idea_type ? <Badge type={idea.idea_type} size="sm" /> : <span className="text-[#2A2A40] text-[11px] font-mono">—</span>}
                    </td>
                  )}
                  {cols.sector && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[11px] text-[#5E5E7A] font-mono capitalize">{idea.sector || '—'}</span>
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusSelect ideaId={idea.id} status={idea.status} onUpdate={(s) => handleStatusUpdate(idea.id, s)} />
                  </td>
                  {cols.grade && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <GradeRing grade={idea.grade_overall} size="sm" />
                    </td>
                  )}
                  {cols.workBegan && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono text-[#3A3A55]">{fmtDate(idea.chat_date)}</span>
                    </td>
                  )}
                  {cols.lastWorked && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono text-[#3A3A55]">{fmtDate(idea.updated_at)}</span>
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <ActionsMenu idea={idea} onArchive={() => handleArchive(idea)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#3A3A55] font-mono">
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-3">
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-2 py-1.5 text-[11px] text-[#5E5E7A] focus:outline-none focus:border-[#F7C948]/30 cursor-pointer"
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n} per page</option>)}
            </select>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#3A3A55] hover:text-[#8888A0] hover:bg-[#1A1A28] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[13px]"
                >
                  ←
                </button>
                {getPaginationPages(page, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-[11px] text-[#3A3A55]">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-mono transition-colors ${
                        p === page
                          ? 'bg-[#F7C948]/10 text-[#F7C948] border border-[#F7C948]/20'
                          : 'text-[#3A3A55] hover:text-[#8888A0] hover:bg-[#1A1A28]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#3A3A55] hover:text-[#8888A0] hover:bg-[#1A1A28] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[13px]"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

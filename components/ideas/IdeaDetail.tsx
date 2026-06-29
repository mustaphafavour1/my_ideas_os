'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Idea, IdeaStatus, IdeaType } from '@/lib/types';
import { Badge, TagBadge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { GradeRing } from '@/components/ui/GradeRing';
import { Button } from '@/components/ui/Button';
import { TransmuteModal } from './TransmuteModal';
import { SaveSignalModal } from './SaveSignalModal';
import { toast } from 'sonner';
import Link from 'next/link';

const STATUSES: IdeaStatus[] = [
  'captured', 'lightly_researched', 'prototyping', 'validated',
  'in_progress', 'paused', 'completed', 'archived',
];

const TYPES: IdeaType[] = [
  'product', 'side_quest', 'portfolio', 'content', 'strategy', 'research',
  'personal_development', 'automation', 'community', 'framework', 'experiment', 'partnership',
];

const GRADE_LABELS = [
  { key: 'grade_novelty', label: 'Novelty' },
  { key: 'grade_feasibility', label: 'Feasibility' },
  { key: 'grade_personal_fit', label: 'Personal Fit' },
  { key: 'grade_market_potential', label: 'Market Potential' },
  { key: 'grade_urgency', label: 'Urgency' },
];

function StatusDropdown({ idea, onUpdate }: { idea: Idea; onUpdate: (s: IdeaStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePick = async (s: IdeaStatus) => {
    if (s === idea.status) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s }),
      });
      if (res.ok) {
        onUpdate(s);
        toast.success(`Status → ${s.replace(/_/g, ' ')}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className="flex items-center gap-1.5 rounded-lg pl-2 pr-3.5 py-1 hover:bg-[#1A1A28] transition-colors disabled:opacity-40"
      >
        <StatusChip status={idea.status} />
        <svg className="w-2.5 h-2.5 text-[#2A2A40] transition-colors" viewBox="0 0 8 8" fill="currentColor">
          <path d="M4 5.5L1 2.5h6L4 5.5z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 min-w-[160px] bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handlePick(s)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#1A1A25] transition-colors ${s === idea.status ? 'opacity-30 pointer-events-none' : ''}`}
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

function computeHighlights(idea: Idea) {
  const pros: string[] = [];
  const cons: string[] = [];

  if ((idea.grade_novelty ?? 0) >= 4) pros.push('Highly novel concept with strong differentiation');
  if ((idea.grade_feasibility ?? 0) >= 4) pros.push('Technically feasible with available resources');
  if ((idea.grade_personal_fit ?? 0) >= 4) pros.push('Strong personal alignment and passion');
  if ((idea.grade_market_potential ?? 0) >= 4) pros.push('Significant market opportunity');
  if ((idea.grade_urgency ?? 0) >= 4) pros.push('Time-sensitive — early mover advantage available');

  if ((idea.grade_novelty ?? 5) <= 2) cons.push('Low differentiation — crowded space');
  if ((idea.grade_feasibility ?? 5) <= 2) cons.push('High execution complexity');
  if ((idea.grade_market_potential ?? 5) <= 2) cons.push('Limited addressable market');
  if ((idea.grade_urgency ?? 5) <= 2) cons.push('Not time-critical — can wait');
  if (idea.blockers && idea.blockers.length > 0) {
    idea.blockers.slice(0, 2).forEach((b) => cons.push(b));
  }

  return { pros, cons };
}

interface IdeaDetailProps {
  initialIdea: Idea;
  parentIdea?: Pick<Idea, 'id' | 'title'> | null;
  childIdeas?: Pick<Idea, 'id' | 'title' | 'status'>[];
}

// Detect if an idea might already be shipped despite having in_progress status
function detectShippedSignals(idea: Idea): boolean {
  if (idea.status !== 'in_progress') return false;
  const text = [idea.description, idea.ai_suggestions, ...(idea.next_steps || [])].join(' ').toLowerCase();
  return /\b(shipped|went live|in production|deployed|launched|live now|already built|it's live|its live|we launched)\b/.test(text);
}

export function IdeaDetail({ initialIdea, parentIdea, childIdeas = [] }: IdeaDetailProps) {
  const router = useRouter();
  const [idea, setIdea] = useState<Idea>(initialIdea);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Idea>>(initialIdea);
  const [newStep, setNewStep] = useState('');
  const [newBlocker, setNewBlocker] = useState('');
  const [showTransmute, setShowTransmute] = useState(false);
  const [showSaveSignal, setShowSaveSignal] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askResponse, setAskResponse] = useState<string | null>(null);
  const [dismissedNudge, setDismissedNudge] = useState(false);

  const inputClass = 'w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-[12px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 transition-colors';

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setIdea(updated);
      setForm(updated);
      setEditing(false);
      toast.success('Idea saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const archiveIdea = async () => {
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    if (res.ok) {
      toast.success('Archived');
      router.push('/ideas');
    }
  };

  const askAboutIdea = async () => {
    if (!askInput.trim()) return;
    setAskLoading(true);
    setAskResponse(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: askInput.trim(), idea_id: idea.id }),
      });
      const data = await res.json();
      setAskResponse(data.response || data.error || 'No response');
      setAskInput('');
    } catch {
      setAskResponse('Something went wrong.');
    } finally {
      setAskLoading(false);
    }
  };

  const printReport = () => {
    const grades = GRADE_LABELS.map((g) => [g.label, idea[g.key as keyof Idea]]);
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
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setForm((f) => ({ ...f, next_steps: [...(f.next_steps || []), newStep.trim()] }));
    setNewStep('');
  };

  const removeStep = (i: number) => {
    const steps = [...(form.next_steps || [])];
    steps.splice(i, 1);
    setForm((f) => ({ ...f, next_steps: steps }));
  };

  const addBlocker = () => {
    if (!newBlocker.trim()) return;
    setForm((f) => ({ ...f, blockers: [...(f.blockers || []), newBlocker.trim()] }));
    setNewBlocker('');
  };

  const removeBlocker = (i: number) => {
    const blockers = [...(form.blockers || [])];
    blockers.splice(i, 1);
    setForm((f) => ({ ...f, blockers }));
  };

  const { pros, cons } = computeHighlights(idea);

  return (
    <>
      {showTransmute && <TransmuteModal idea={idea} onClose={() => setShowTransmute(false)} />}
      {showSaveSignal && <SaveSignalModal ideaId={idea.id} ideaTitle={idea.title} onClose={() => setShowSaveSignal(false)} />}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        {/* Breadcrumbs — outside grid so sidebar aligns with header card */}
        <div className="px-4 lg:px-8 pt-8 lg:pt-10 pb-0 max-w-6xl mx-auto w-full">
          <nav className="flex items-center gap-1 text-[10px] font-mono flex-wrap">
            <Link href="/ideas" className="text-[#3A3A55] hover:text-[#6A6A80] transition-colors">Ideas</Link>
            {parentIdea && (
              <>
                <span className="text-[#252540] mx-0.5">/</span>
                <Link href={`/ideas/${parentIdea.id}`} className="text-[#3A3A55] hover:text-[#6A6A80] transition-colors truncate max-w-[160px]">{parentIdea.title}</Link>
              </>
            )}
            <span className="text-[#252540] mx-0.5">/</span>
            <span className="text-[#5E5E7A] truncate max-w-[200px]">{idea.title}</span>
          </nav>

          {/* Shipped status nudge */}
          {!dismissedNudge && detectShippedSignals(idea) && (
            <div className="mt-3 flex items-center gap-3 bg-[#F7C948]/8 border border-[#F7C948]/20 rounded-xl px-4 py-2.5">
              <span className="text-[#F7C948] text-sm shrink-0">✦</span>
              <p className="text-[11px] text-[#C0B060] flex-1">
                This idea looks like it might already be live — is the status still accurate?
              </p>
              <button
                onClick={() => {
                  setForm((f) => ({ ...f, status: 'completed' }));
                  setEditing(true);
                  setDismissedNudge(true);
                }}
                className="text-[10px] font-mono text-[#F7C948] hover:text-[#E6B830] transition-colors whitespace-nowrap"
              >
                Mark completed →
              </button>
              <button onClick={() => setDismissedNudge(true)} className="text-[#3A3A55] hover:text-[#6A6A80] text-[11px]">✕</button>
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 px-4 lg:px-8 pt-5 pb-8 lg:pb-10 max-w-6xl mx-auto w-full">
          {/* Main column */}
          <div className="space-y-5">
            {/* Header card — title + status + description + metadata */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                {editing ? (
                  <input
                    className={`${inputClass} text-[15px] font-semibold flex-1`}
                    value={form.title || ''}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                ) : (
                  <h1 className="text-[17px] font-bold text-[#E8E8F0] flex-1 leading-snug">{idea.title}</h1>
                )}
                <div className="flex gap-2 shrink-0">
                  {editing ? (
                    <>
                      <Button size="sm" loading={saving} onClick={save}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(idea); }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setShowTransmute(true)} title="Try in new context">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Transmute
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
                    </>
                  )}
                </div>
              </div>

              {/* Status inline + type badges */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {editing ? (
                  <>
                    <select
                      value={form.idea_type || ''}
                      onChange={(e) => setForm((f) => ({ ...f, idea_type: e.target.value as IdeaType }))}
                      className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-2 py-1 text-[11px] text-[#8888A0] focus:outline-none"
                    >
                      <option value="">No type</option>
                      {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                    <select
                      value={form.status || 'captured'}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as IdeaStatus }))}
                      className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-2 py-1 text-[11px] text-[#8888A0] focus:outline-none"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    {idea.idea_type && <Badge type={idea.idea_type} />}
                    <StatusDropdown idea={idea} onUpdate={(s) => setIdea((i) => ({ ...i, status: s }))} />
                  </>
                )}
              </div>

              {/* Description inside header card */}
              <div className="mb-5">
                {editing ? (
                  <textarea
                    rows={3}
                    value={form.description || ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={`${inputClass} resize-none`}
                    placeholder="Describe the idea…"
                  />
                ) : (
                  <p className="text-[13px] text-[#7A7A90] leading-relaxed">
                    {idea.description || <span className="text-[#3A3A55] italic">No description yet.</span>}
                  </p>
                )}
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] font-mono pt-4 border-t border-[#1A1A28]">
                {[
                  { label: 'Sector', value: idea.sector, editing: true, field: 'sector' },
                  { label: 'Source', value: idea.source_type?.replace(/_/g, ' ') || '—' },
                  { label: 'Chat Date', value: idea.chat_date ? new Date(idea.chat_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                  { label: 'Last Updated', value: new Date(idea.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                ].map(({ label, value, editing: isEditable, field }) => (
                  <div key={label}>
                    <p className="text-[#3A3A55] mb-1 uppercase tracking-widest text-[9px]">{label}</p>
                    {editing && isEditable && field ? (
                      <input
                        value={(form[field as keyof Idea] as string) || ''}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        className="w-full bg-transparent border-b border-[#1E1E2E] text-[#8888A0] focus:outline-none text-[11px]"
                      />
                    ) : (
                      <p className="text-[#6A6A80]">{value || '—'}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ask about this idea — directly below header */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#F7C948]">✦</span>
                <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">Ask about this idea</h2>
              </div>
              {askResponse && (
                <div className="bg-[#0D0D18] border border-[#1A1A28] rounded-xl p-4 mb-3 relative">
                  <button onClick={() => setAskResponse(null)} className="absolute top-3 right-3 text-[#3A3A55] hover:text-[#5E5E7A] text-[10px]">✕</button>
                  <p className="text-[12px] text-[#8888A0] leading-relaxed whitespace-pre-wrap pr-4">{askResponse}</p>
                </div>
              )}
              {askLoading && (
                <div className="flex items-center gap-2 py-2 mb-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#F7C948]/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-[#3A3A55]">thinking…</span>
                </div>
              )}
              <div className="space-y-2">
                <textarea
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !askLoading && (e.preventDefault(), askAboutIdea())}
                  placeholder="What's the fastest way to validate this?… (Enter to send)"
                  disabled={askLoading}
                  rows={4}
                  className={`${inputClass} resize-none leading-relaxed`}
                />
                <div className="flex justify-end">
                  <Button size="sm" loading={askLoading} onClick={askAboutIdea} disabled={!askInput.trim()}>Ask</Button>
                </div>
              </div>
            </div>

            {/* Highlights — always show both cards once there's at least one point */}
            {(pros.length > 0 || cons.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {/* Strengths — only show if there are any */}
                {pros.length > 0 && (
                  <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                    <p className="text-[10px] font-mono text-[#3AB870]/70 uppercase tracking-widest mb-3">Strengths</p>
                    <ul className="space-y-2">
                      {pros.map((p, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-[#6A6A80]">
                          <span className="text-[#3AB870] shrink-0 mt-0.5">+</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Concerns — always show */}
                <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                  <p className="text-[10px] font-mono text-[#C06830]/70 uppercase tracking-widest mb-3">Concerns</p>
                  {cons.length > 0 ? (
                    <ul className="space-y-2">
                      {cons.map((c, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-[#6A6A80]">
                          <span className="text-[#C06830] shrink-0 mt-0.5">!</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-[#3AB870]/60 font-mono">No concerns for now</p>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps + Blockers side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
                <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-4">Next Steps</h2>
                <div className="space-y-2.5 mb-4">
                  {(editing ? form.next_steps : idea.next_steps)?.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[#5E5E7A] shrink-0 mt-1 leading-none">•</span>
                      <span className="text-[12px] text-[#7A7A90] flex-1 leading-snug">{step}</span>
                      {editing && (
                        <button onClick={() => removeStep(i)} className="text-[#3A3A55] hover:text-[#F87171] text-[10px] shrink-0">✕</button>
                      )}
                    </div>
                  ))}
                  {(editing ? form.next_steps : idea.next_steps)?.length === 0 && (
                    <p className="text-[11px] text-[#3A3A55] font-mono">No next steps yet.</p>
                  )}
                </div>
                {editing && (
                  <div className="flex gap-2">
                    <input
                      value={newStep}
                      onChange={(e) => setNewStep(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                      placeholder="Add a next step…"
                      className={`${inputClass} flex-1`}
                    />
                    <Button size="sm" variant="secondary" onClick={addStep}>Add</Button>
                  </div>
                )}
              </div>

              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
                <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-4">Blockers</h2>
                <div className="space-y-2.5 mb-4">
                  {(editing ? form.blockers : idea.blockers)?.map((b, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[#C06830] text-[10px] mt-1 shrink-0">●</span>
                      <span className="text-[12px] text-[#7A7A90] flex-1 leading-snug">{b}</span>
                      {editing && (
                        <button onClick={() => removeBlocker(i)} className="text-[#3A3A55] hover:text-[#F87171] text-[10px] shrink-0">✕</button>
                      )}
                    </div>
                  ))}
                  {(editing ? form.blockers : idea.blockers)?.length === 0 && (
                    <p className="text-[11px] text-[#3AB870]/60 font-mono">No blockers — clear runway!</p>
                  )}
                </div>
                {editing && (
                  <div className="flex gap-2">
                    <input
                      value={newBlocker}
                      onChange={(e) => setNewBlocker(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBlocker())}
                      placeholder="Add a blocker…"
                      className={`${inputClass} flex-1`}
                    />
                    <Button size="sm" variant="secondary" onClick={addBlocker}>Add</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {idea.tags && idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag) => <TagBadge key={tag} label={tag} />)}
              </div>
            )}

            {/* Related ideas — children */}
            {childIdeas.length > 0 && (
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-3">
                  Sub-ideas <span className="text-[#2A2A40]">({childIdeas.length})</span>
                </h2>
                <div className="space-y-2">
                  {childIdeas.map((child) => (
                    <Link key={child.id} href={`/ideas/${child.id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1A1A28] transition-colors group">
                      <span className="text-[#2A2A40] text-[10px] shrink-0">↳</span>
                      <span className="text-[12px] text-[#D0D0DA] flex-1 truncate group-hover:text-[#E8E8F0] transition-colors">{child.title}</span>
                      <StatusChip status={child.status} size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Your complaints — from conversation extraction */}
            {((idea.user_complaints?.length > 0) || (idea.rephrasing_suggestions?.length > 0)) && (
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-4">Your Complaints</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {idea.user_complaints?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-mono text-[#C06830]/70 uppercase tracking-widest mb-2">Frustrations logged</p>
                      <ul className="space-y-1.5">
                        {idea.user_complaints.map((c, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-[#7A7A90]">
                            <span className="text-[#C06830] shrink-0">!</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {idea.rephrasing_suggestions?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-mono text-[#7A7AF0]/70 uppercase tracking-widest mb-2">Rephrasing moments</p>
                      <ul className="space-y-1.5">
                        {idea.rephrasing_suggestions.map((r, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-[#7A7A90]">
                            <span className="text-[#7A7AF0] shrink-0">↺</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* AI Suggestion */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#F7C948] text-sm">✦</span>
                <h3 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">AI Suggestion</h3>
              </div>
              <p className="text-[12px] text-[#7A7A90] leading-relaxed">
                {idea.ai_suggestions || 'Run a sync to get AI-generated suggestions for this idea.'}
              </p>
            </div>

            {/* Grade Breakdown — horizontal bars like By Type chart */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">Grade Breakdown</h3>
                <div className="flex items-center gap-1.5">
                  <GradeRing grade={idea.grade_overall} size="sm" />
                  <span className="text-[10px] font-mono text-[#3A3A55]">overall</span>
                </div>
              </div>
              <div className="space-y-3">
                {GRADE_LABELS.map((g) => {
                  const val = idea[g.key as keyof Idea] as number | null;
                  return (
                    <div key={g.key}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[10px] font-mono text-[#6A6A80]">{g.label}</span>
                        {editing ? (
                          <select
                            value={String(form[g.key as keyof typeof form] || '')}
                            onChange={(e) => setForm((f) => ({ ...f, [g.key]: e.target.value ? parseInt(e.target.value) : null }))}
                            className="w-10 text-center bg-[#0A0A0F] border border-[#1E1E2E] rounded text-[10px] text-[#F0F0F5] py-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">—</option>
                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        ) : (
                          <span className="text-[10px] font-mono text-[#4A4A60]">{val ?? '—'}</span>
                        )}
                      </div>
                      <div className="h-[3px] bg-[#1A1A28] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: val ? `${(val / 5) * 100}%` : '0%',
                            background: 'linear-gradient(90deg, #F7C948 0%, rgba(247,201,72,0.4) 100%)',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Next Steps */}
            {idea.ai_next_steps && idea.ai_next_steps.length > 0 && (
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                <h3 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-3">AI Recommended Steps</h3>
                <ul className="space-y-2">
                  {idea.ai_next_steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-[#7A7A90]">
                      <span className="text-[#F7C948] shrink-0 font-mono">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 space-y-2">
              <h3 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-3">Actions</h3>
              <Button variant="secondary" size="sm" onClick={() => setShowTransmute(true)} className="w-full justify-start">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Transmute Idea
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSaveSignal(true)} className="w-full justify-start">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Save Signal
              </Button>
              <Button variant="secondary" size="sm" onClick={printReport} className="w-full justify-start">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PDF
              </Button>
              <Button variant="danger" size="sm" onClick={archiveIdea} className="w-full justify-start">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive Idea
              </Button>
            </div>

            {/* Raw Source */}
            {idea.raw_source && (
              <details className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                <summary className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest cursor-pointer">Raw Source</summary>
                <p className="mt-3 text-[10px] text-[#3A3A55] font-mono leading-relaxed line-clamp-[12]">
                  {idea.raw_source}
                </p>
              </details>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

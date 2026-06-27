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
}

export function IdeaDetail({ initialIdea }: IdeaDetailProps) {
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

  const quickStatus = async (status: IdeaStatus) => {
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIdea(updated);
      setForm(updated);
      toast.success(`Status → ${status.replace(/_/g, ' ')}`);
    }
  };

  const archiveIdea = async () => {
    await quickStatus('archived');
    router.push('/ideas');
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
</head><body>
<h1>${idea.title}</h1>
<div class="meta">
${idea.status ? `<span class="badge">${idea.status.replace(/_/g, ' ')}</span>` : ''}
${idea.idea_type ? `<span class="badge">${idea.idea_type.replace(/_/g, ' ')}</span>` : ''}
${idea.sector ? `<span class="badge">${idea.sector}</span>` : ''}
<span>Overall Grade: ${idea.grade_overall ?? '—'}/5</span>
</div>
${idea.description ? `<h2>Description</h2><p>${idea.description}</p>` : ''}
<h2>Grades</h2>
<div class="grades">${grades.map(([l, v]) => `<div class="grade-item"><div class="grade-val">${v ?? '—'}</div><div class="grade-label">${l}</div></div>`).join('')}</div>
${(idea.next_steps?.length ?? 0) > 0 ? `<h2>Next Steps</h2><ul>${idea.next_steps.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
${(idea.blockers?.length ?? 0) > 0 ? `<h2>Blockers</h2><ul>${idea.blockers.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
${idea.ai_suggestions ? `<h2>AI Suggestion</h2><div class="suggestion">${idea.ai_suggestions}</div>` : ''}
<div class="footer">Idea OS · ${new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
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
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 p-4 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Main column */}
          <div className="space-y-5">
            {/* Header card */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
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

              <div className="flex flex-wrap gap-2 mb-5">
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
                    <StatusChip status={idea.status} />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] font-mono">
                {[
                  { label: 'Sector', value: idea.sector, editing: true, field: 'sector' },
                  { label: 'Source', value: idea.source_type?.replace(/_/g, ' ') || '—' },
                  { label: 'Chat Date', value: idea.chat_date ? new Date(idea.chat_date).toLocaleDateString('en-GB') : '—' },
                  { label: 'Last Updated', value: new Date(idea.updated_at).toLocaleDateString('en-GB') },
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

            {/* Highlights */}
            {(pros.length > 0 || cons.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
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
                {cons.length > 0 && (
                  <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                    <p className="text-[10px] font-mono text-[#C06830]/70 uppercase tracking-widest mb-3">Concerns</p>
                    <ul className="space-y-2">
                      {cons.map((c, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-[#6A6A80]">
                          <span className="text-[#C06830] shrink-0 mt-0.5">!</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
              <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-3">Description</h2>
              {editing ? (
                <textarea
                  rows={4}
                  value={form.description || ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  placeholder="Describe the idea…"
                />
              ) : (
                <p className="text-[13px] text-[#7A7A90] leading-relaxed">
                  {idea.description || 'No description yet.'}
                </p>
              )}
            </div>

            {/* Grades */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
              <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-5">Grade Breakdown</h2>
              <div className="flex flex-wrap gap-6 items-end justify-around">
                <div className="flex flex-col items-center gap-2">
                  <GradeRing grade={idea.grade_overall} size="lg" />
                  <span className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest">Overall</span>
                </div>
                {GRADE_LABELS.map((g) => {
                  const val = idea[g.key as keyof Idea] as number | null;
                  return (
                    <div key={g.key} className="flex flex-col items-center gap-2">
                      {editing ? (
                        <select
                          value={String(form[g.key as keyof typeof form] || '')}
                          onChange={(e) => setForm((f) => ({ ...f, [g.key]: e.target.value ? parseInt(e.target.value) : null }))}
                          className="w-14 text-center bg-[#0A0A0F] border border-[#1E1E2E] rounded text-[11px] text-[#F0F0F5] py-1"
                        >
                          <option value="">—</option>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      ) : (
                        <GradeRing grade={val} size="md" />
                      )}
                      <span className="text-[9px] font-mono text-[#3A3A55] uppercase tracking-widest text-center">{g.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
              <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-4">Next Steps</h2>
              <div className="space-y-2.5 mb-4">
                {(editing ? form.next_steps : idea.next_steps)?.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 mt-0.5 rounded border border-[#2A2A3A] shrink-0" />
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

            {/* Blockers */}
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

            {/* Ask about this idea */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#F7C948]">✦</span>
                <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">Ask about this idea</h2>
              </div>
              {askResponse && (
                <div className="bg-[#0D0D18] border border-[#1A1A28] rounded-xl p-4 mb-4 relative">
                  <button onClick={() => setAskResponse(null)} className="absolute top-3 right-3 text-[#3A3A55] hover:text-[#5E5E7A] text-[10px]">✕</button>
                  <p className="text-[12px] text-[#8888A0] leading-relaxed whitespace-pre-wrap pr-4">{askResponse}</p>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !askLoading && askAboutIdea()}
                  placeholder="What's the fastest way to validate this? What should I do first?…"
                  disabled={askLoading}
                  className={`${inputClass} flex-1`}
                />
                <Button size="sm" loading={askLoading} onClick={askAboutIdea} disabled={!askInput.trim()}>Ask</Button>
              </div>
            </div>

            {/* Tags */}
            {idea.tags && idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag) => <TagBadge key={tag} label={tag} />)}
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

            {/* Status */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
              <h3 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-3">Status</h3>
              <div className="space-y-0.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => s !== idea.status && quickStatus(s)}
                    disabled={s === idea.status}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                      s === idea.status ? 'bg-[#1A1A28] cursor-default' : 'hover:bg-[#141420] cursor-pointer'
                    }`}
                  >
                    <StatusChip status={s} size="sm" />
                    {s === idea.status && (
                      <span className="ml-auto text-[9px] font-mono text-[#3A3A55] tracking-wide">current</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

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

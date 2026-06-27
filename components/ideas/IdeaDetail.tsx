'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Idea, IdeaStatus, IdeaType } from '@/lib/types';
import { Badge, TagBadge } from '@/components/ui/Badge';
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

interface IdeaDetailProps {
  initialIdea: Idea;
}

const GRADE_LABELS = [
  { key: 'grade_novelty', label: 'Novelty' },
  { key: 'grade_feasibility', label: 'Feasibility' },
  { key: 'grade_personal_fit', label: 'Personal Fit' },
  { key: 'grade_market_potential', label: 'Market Potential' },
  { key: 'grade_urgency', label: 'Urgency' },
];

export function IdeaDetail({ initialIdea }: IdeaDetailProps) {
  const router = useRouter();
  const [idea, setIdea] = useState<Idea>(initialIdea);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Idea>>(initialIdea);
  const [newStep, setNewStep] = useState('');
  const [newBlocker, setNewBlocker] = useState('');

  const inputClass = 'w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] placeholder-[#4A4A60] focus:outline-none focus:border-[#F7C948]/40';

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
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`);
    }
  };

  const archiveIdea = async () => {
    await quickStatus('archived');
    router.push('/ideas');
  };

  const downloadReport = () => {
    const grades = GRADE_LABELS.map(
      (g) => `- **${g.label}**: ${idea[g.key as keyof Idea] ?? 'N/A'}/5`
    ).join('\n');

    const md = `# ${idea.title}

**Type**: ${idea.idea_type || 'N/A'}
**Status**: ${idea.status}
**Sector**: ${idea.sector || 'N/A'}
**Overall Grade**: ${idea.grade_overall ?? 'N/A'}/5

## Description
${idea.description || 'No description.'}

## Grades
${grades}

## Next Steps
${idea.next_steps?.map((s) => `- [ ] ${s}`).join('\n') || 'None'}

## Blockers
${idea.blockers?.map((b) => `- ${b}`).join('\n') || 'None'}

## AI Suggestion
${idea.ai_suggestions || 'No AI suggestion yet.'}

---
*Generated ${new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}*
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    const steps = [...(form.next_steps || []), newStep.trim()];
    setForm((f) => ({ ...f, next_steps: steps }));
    setNewStep('');
  };

  const removeStep = (i: number) => {
    const steps = [...(form.next_steps || [])];
    steps.splice(i, 1);
    setForm((f) => ({ ...f, next_steps: steps }));
  };

  const addBlocker = () => {
    if (!newBlocker.trim()) return;
    const blockers = [...(form.blockers || []), newBlocker.trim()];
    setForm((f) => ({ ...f, blockers }));
    setNewBlocker('');
  };

  const removeBlocker = (i: number) => {
    const blockers = [...(form.blockers || [])];
    blockers.splice(i, 1);
    setForm((f) => ({ ...f, blockers }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col"
    >
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 p-4 lg:p-8 max-w-6xl mx-auto w-full">
        {/* Main */}
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              {editing ? (
                <input
                  className={`${inputClass} text-lg font-semibold flex-1`}
                  value={form.title || ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              ) : (
                <h1 className="text-xl font-bold text-[#F0F0F5] flex-1">{idea.title}</h1>
              )}
              <div className="flex gap-2 shrink-0">
                {editing ? (
                  <>
                    <Button size="sm" loading={saving} onClick={save}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(idea); }}>Cancel</Button>
                  </>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {editing ? (
                <>
                  <select
                    value={form.idea_type || ''}
                    onChange={(e) => setForm((f) => ({ ...f, idea_type: e.target.value as IdeaType }))}
                    className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-2 py-1 text-xs text-[#8888A0]"
                  >
                    <option value="">No type</option>
                    {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                  <select
                    value={form.status || 'captured'}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as IdeaStatus }))}
                    className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-2 py-1 text-xs text-[#8888A0]"
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-[#4A4A60]">
              <div>
                <p className="text-[#4A4A60] mb-0.5">Sector</p>
                {editing ? (
                  <input
                    value={form.sector || ''}
                    onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                    className="w-full bg-transparent border-b border-[#1E1E2E] text-[#8888A0] focus:outline-none focus:border-[#F7C948]/40"
                  />
                ) : (
                  <p className="text-[#8888A0]">{idea.sector || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-[#4A4A60] mb-0.5">Source</p>
                <p className="text-[#8888A0]">{idea.source_type?.replace(/_/g, ' ') || '—'}</p>
              </div>
              <div>
                <p className="text-[#4A4A60] mb-0.5">Chat Date</p>
                <p className="text-[#8888A0]">{idea.chat_date ? new Date(idea.chat_date).toLocaleDateString('en-GB') : '—'}</p>
              </div>
              <div>
                <p className="text-[#4A4A60] mb-0.5">Created</p>
                <p className="text-[#8888A0]">{new Date(idea.created_at).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">Description</h2>
            {editing ? (
              <textarea
                rows={4}
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={`${inputClass} resize-none`}
                placeholder="Describe the idea…"
              />
            ) : (
              <p className="text-sm text-[#8888A0] leading-relaxed">
                {idea.description || 'No description yet.'}
              </p>
            )}
          </div>

          {/* Grades */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-[#F0F0F5] mb-4">Grade Breakdown</h2>
            <div className="flex flex-wrap gap-6 items-center justify-around">
              <div className="flex flex-col items-center gap-2">
                <GradeRing grade={idea.grade_overall} size="lg" />
                <span className="text-[10px] font-mono text-[#4A4A60] uppercase">Overall</span>
              </div>
              {GRADE_LABELS.map((g) => {
                const val = idea[g.key as keyof Idea] as number | null;
                return (
                  <div key={g.key} className="flex flex-col items-center gap-2">
                    {editing ? (
                      <select
                        value={String(form[g.key as keyof typeof form] || '')}
                        onChange={(e) => setForm((f) => ({ ...f, [g.key]: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-16 text-center bg-[#0A0A0F] border border-[#1E1E2E] rounded text-sm text-[#F0F0F5] py-1"
                      >
                        <option value="">—</option>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <GradeRing grade={val} size="md" />
                    )}
                    <span className="text-[10px] font-mono text-[#4A4A60] uppercase text-center">{g.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">Next Steps</h2>
            <div className="space-y-2 mb-3">
              {(editing ? form.next_steps : idea.next_steps)?.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 mt-0.5 rounded border border-[#2A2A3A] shrink-0" />
                  <span className="text-sm text-[#8888A0] flex-1">{step}</span>
                  {editing && (
                    <button onClick={() => removeStep(i)} className="text-[#4A4A60] hover:text-[#F87171] text-xs shrink-0">✕</button>
                  )}
                </div>
              ))}
              {(editing ? form.next_steps : idea.next_steps)?.length === 0 && (
                <p className="text-xs text-[#4A4A60]">No next steps yet.</p>
              )}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                  placeholder="Add a next step…"
                  className={`${inputClass} flex-1 text-xs`}
                />
                <Button size="sm" variant="secondary" onClick={addStep}>Add</Button>
              </div>
            )}
          </div>

          {/* Blockers */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
            <h2 className="text-sm font-semibold text-[#F0F0F5] mb-3">Blockers</h2>
            <div className="space-y-2 mb-3">
              {(editing ? form.blockers : idea.blockers)?.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#FB923C] text-xs mt-0.5 shrink-0">●</span>
                  <span className="text-sm text-[#8888A0] flex-1">{b}</span>
                  {editing && (
                    <button onClick={() => removeBlocker(i)} className="text-[#4A4A60] hover:text-[#F87171] text-xs shrink-0">✕</button>
                  )}
                </div>
              ))}
              {(editing ? form.blockers : idea.blockers)?.length === 0 && (
                <p className="text-xs text-[#4A4A60] text-[#4ADE80]">No blockers — clear runway!</p>
              )}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input
                  value={newBlocker}
                  onChange={(e) => setNewBlocker(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBlocker())}
                  placeholder="Add a blocker…"
                  className={`${inputClass} flex-1 text-xs`}
                />
                <Button size="sm" variant="secondary" onClick={addBlocker}>Add</Button>
              </div>
            )}
          </div>

          {/* Tags */}
          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag) => <TagBadge key={tag} label={tag} />)}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* AI Suggestion */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#F7C948] text-sm">✦</span>
              <h3 className="text-sm font-semibold text-[#F0F0F5]">AI Suggestion</h3>
            </div>
            <p className="text-xs text-[#8888A0] leading-relaxed">
              {idea.ai_suggestions || 'Run a sync to get AI-generated suggestions for this idea.'}
            </p>
          </div>

          {/* AI Next Steps */}
          {idea.ai_next_steps && idea.ai_next_steps.length > 0 && (
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#F0F0F5] mb-3">AI Recommended Steps</h3>
              <ul className="space-y-1.5">
                {idea.ai_next_steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[#8888A0]">
                    <span className="text-[#F7C948] shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-[#F0F0F5] mb-3">Actions</h3>
            <Button variant="secondary" size="sm" onClick={downloadReport} className="w-full justify-start">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Report
            </Button>
            <Button variant="danger" size="sm" onClick={archiveIdea} className="w-full justify-start">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archive Idea
            </Button>
          </div>

          {/* Status */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest mb-3">Status</h3>
            <div className="space-y-0.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => s !== idea.status && quickStatus(s)}
                  disabled={s === idea.status}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                    s === idea.status
                      ? 'bg-[#1A1A28] cursor-default'
                      : 'hover:bg-[#141420] cursor-pointer'
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

          {/* Raw Source */}
          {idea.raw_source && (
            <details className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
              <summary className="text-sm font-semibold text-[#F0F0F5] cursor-pointer">Raw Source</summary>
              <p className="mt-3 text-xs text-[#4A4A60] font-mono leading-relaxed line-clamp-[12]">
                {idea.raw_source}
              </p>
            </details>
          )}
        </div>
      </div>
    </motion.div>
  );
}

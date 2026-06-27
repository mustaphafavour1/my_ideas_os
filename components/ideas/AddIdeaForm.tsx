'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IdeaType, IdeaStatus } from '@/lib/types';
import { toast } from 'sonner';

interface AddIdeaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const TYPES: IdeaType[] = [
  'product', 'side_quest', 'portfolio', 'content', 'strategy', 'research',
  'personal_development', 'automation', 'community', 'framework', 'experiment', 'partnership',
];

const STATUSES: IdeaStatus[] = [
  'captured', 'lightly_researched', 'prototyping', 'validated',
  'in_progress', 'paused', 'completed', 'archived',
];

export function AddIdeaForm({ onSuccess, onCancel }: AddIdeaFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    sector: '',
    idea_type: '' as IdeaType | '',
    status: 'captured' as IdeaStatus,
    grade_novelty: '',
    grade_feasibility: '',
    grade_personal_fit: '',
    grade_market_potential: '',
    grade_urgency: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        sector: form.sector.trim() || null,
        idea_type: form.idea_type || null,
        status: form.status,
        source_type: 'manual' as const,
        grade_novelty: form.grade_novelty ? parseInt(form.grade_novelty) : null,
        grade_feasibility: form.grade_feasibility ? parseInt(form.grade_feasibility) : null,
        grade_personal_fit: form.grade_personal_fit ? parseInt(form.grade_personal_fit) : null,
        grade_market_potential: form.grade_market_potential ? parseInt(form.grade_market_potential) : null,
        grade_urgency: form.grade_urgency ? parseInt(form.grade_urgency) : null,
        next_steps: [],
        blockers: [],
        tags: [],
      };

      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save idea');
      toast.success('Idea added!');
      onSuccess();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-[#F0F0F5] placeholder-[#4A4A60] focus:outline-none focus:border-[#F7C948]/40 transition-colors';
  const labelClass = 'block text-xs font-mono text-[#8888A0] mb-1.5';

  const GradeSelect = ({ field }: { field: string }) => (
    <select
      value={form[field as keyof typeof form]}
      onChange={(e) => set(field, e.target.value)}
      className={inputClass}
    >
      <option value="">—</option>
      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Title *</label>
        <input
          type="text"
          required
          placeholder="What's the idea?"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className={inputClass}
          autoFocus
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={3}
          placeholder="A brief description…"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Type</label>
          <select value={form.idea_type} onChange={(e) => set('idea_type', e.target.value)} className={inputClass}>
            <option value="">Select type…</option>
            {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Sector</label>
        <input
          type="text"
          placeholder="fintech, health-tech, education…"
          value={form.sector}
          onChange={(e) => set('sector', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Grades (1–5)</label>
        <div className="grid grid-cols-5 gap-2">
          {['grade_novelty', 'grade_feasibility', 'grade_personal_fit', 'grade_market_potential', 'grade_urgency'].map((f) => (
            <div key={f}>
              <p className="text-[10px] font-mono text-[#4A4A60] mb-1 text-center">
                {f.replace('grade_', '').replace(/_/g, ' ').split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ').replace('Market Potential', 'Market').replace('Personal Fit', 'Fit')}
              </p>
              <GradeSelect field={f} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={saving} className="flex-1">
          Add Idea
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

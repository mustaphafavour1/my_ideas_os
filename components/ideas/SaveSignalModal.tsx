'use client';

import { useState } from 'react';
import { SignalType } from '@/lib/types';
import { toast } from 'sonner';

const SIGNAL_TYPES: { value: SignalType; label: string; desc: string }[] = [
  { value: 'strategy',    label: 'Strategy',    desc: 'An approach or tactic' },
  { value: 'pattern',     label: 'Pattern',     desc: 'A recurring theme' },
  { value: 'principle',   label: 'Principle',   desc: 'A core belief' },
  { value: 'opportunity', label: 'Opportunity', desc: 'A gap or opening' },
  { value: 'risk',        label: 'Risk',        desc: 'A threat to watch' },
  { value: 'lesson',      label: 'Lesson',      desc: 'Something learned' },
];

interface SaveSignalModalProps {
  ideaId: string;
  ideaTitle: string;
  onClose: () => void;
  prefill?: string;
}

export function SaveSignalModal({ ideaId, ideaTitle, onClose, prefill = '' }: SaveSignalModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(prefill);
  const [signalType, setSignalType] = useState<SignalType>('strategy');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), signal_type: signalType, idea_id: ideaId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      toast.success('Signal saved to Signals');
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D0D18] border border-[#1E1E2E] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#1A1A28]">
          <div>
            <h2 className="text-[13px] font-semibold text-[#E0E0EA]">Save Signal</h2>
            <p className="text-[10px] font-mono text-[#3A3A55] mt-0.5">from · {ideaTitle}</p>
          </div>
          <button onClick={onClose} className="text-[#3A3A55] hover:text-[#5E5E7A] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this signal…"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-[12px] text-[#E0E0EA] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-2">Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SIGNAL_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSignalType(t.value)}
                  className={`px-2 py-2 rounded-lg text-[10px] font-mono text-left transition-all border ${
                    signalType === t.value
                      ? 'border-[#F7C948]/30 bg-[#F7C948]/8 text-[#F7C948]'
                      : 'border-[#1E1E2E] text-[#4A4A60] hover:border-[#2A2A3A] hover:text-[#6A6A80]'
                  }`}
                >
                  <div className="font-semibold">{t.label}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-2">Signal content</label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the strategy, pattern, or insight you want to capture…"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-[12px] text-[#E0E0EA] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 resize-none transition-colors"
            />
          </div>

          <button
            onClick={save}
            disabled={saving || !title.trim() || !content.trim()}
            className="w-full py-2.5 bg-[#F7C948] text-[#0A0A0F] text-[11px] font-mono font-semibold rounded-xl hover:bg-[#E6B830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save Signal'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Idea } from '@/lib/types';

interface TransmuteResult {
  title: string;
  concept: string;
  adaptations: string[];
  opportunities: string[];
  challenges: string[];
}

interface TransmuteModalProps {
  idea: Idea;
  onClose: () => void;
}

const CONTEXT_SUGGESTIONS = [
  'Healthcare / MedTech',
  'Education / EdTech',
  'African markets',
  'B2B SaaS',
  'Web3 / Blockchain',
  'Climate tech',
  'Creator economy',
  'Government / Public sector',
];

export function TransmuteModal({ idea, onClose }: TransmuteModalProps) {
  const [context, setContext] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransmuteResult | null>(null);
  const [error, setError] = useState('');

  const transmute = async () => {
    if (!context.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/transmute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: { title: idea.title, description: idea.description, sector: idea.sector, idea_type: idea.idea_type }, context: context.trim(), prompt: prompt.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0D0D18] border border-[#1E1E2E] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#1A1A28]">
          <div>
            <h2 className="text-[13px] font-semibold text-[#E0E0EA] mb-0.5">Transmute Idea</h2>
            <p className="text-[11px] font-mono text-[#4A4A60]">{idea.title}</p>
          </div>
          <button onClick={onClose} className="text-[#3A3A55] hover:text-[#6A6A80] transition-colors mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!result ? (
            <>
              {/* Context input */}
              <div>
                <label className="block text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-2">
                  Target context / market / direction
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. healthcare, B2B SaaS, African markets…"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[13px] text-[#E0E0EA] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 transition-colors"
                />
                {/* Quick context chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {CONTEXT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setContext(s)}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        context === s
                          ? 'border-[#F7C948]/40 text-[#F7C948] bg-[#F7C948]/8'
                          : 'border-[#1E1E2E] text-[#4A4A60] hover:border-[#2A2A3A] hover:text-[#6A6A80]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional prompt */}
              <div>
                <label className="block text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-2">
                  Additional guidance <span className="text-[#2A2A40]">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Any specific angle, constraint, or question you want explored…"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[12px] text-[#E0E0EA] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/30 resize-none transition-colors"
                />
              </div>

              {error && <p className="text-[11px] text-red-400 font-mono">{error}</p>}

              <button
                onClick={transmute}
                disabled={loading || !context.trim()}
                className="w-full py-3 bg-[#F7C948] text-[#0A0A0F] text-[12px] font-mono font-semibold rounded-xl hover:bg-[#E6B830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
                    Transmuting…
                  </>
                ) : '✦ Transmute'}
              </button>
            </>
          ) : (
            <>
              {/* Result */}
              <div className="space-y-4">
                <div className="bg-[#F7C948]/6 border border-[#F7C948]/15 rounded-xl px-5 py-4">
                  <p className="text-[10px] font-mono text-[#F7C948]/60 uppercase tracking-widest mb-1">Reframed as</p>
                  <p className="text-[15px] font-semibold text-[#E8E0C0]">{result.title}</p>
                </div>

                <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-5 py-4">
                  <p className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-2">Core concept</p>
                  <p className="text-[12px] text-[#8888A0] leading-relaxed">{result.concept}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-5 py-4">
                    <p className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-3">Adaptations needed</p>
                    <ul className="space-y-2">
                      {result.adaptations.map((a, i) => (
                        <li key={i} className="flex gap-2 text-[11px] text-[#8888A0]">
                          <span className="text-[#F7C948] shrink-0 font-mono">{i + 1}.</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-5 py-4">
                      <p className="text-[10px] font-mono text-[#3AB870]/80 uppercase tracking-widest mb-3">Opportunities</p>
                      <ul className="space-y-1.5">
                        {result.opportunities.map((o, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-[#8888A0]">
                            <span className="text-[#3AB870] shrink-0 mt-0.5">+</span>
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-5 py-4">
                      <p className="text-[10px] font-mono text-[#C06830]/80 uppercase tracking-widest mb-3">Challenges</p>
                      <ul className="space-y-1.5">
                        {result.challenges.map((c, i) => (
                          <li key={i} className="flex gap-2 text-[11px] text-[#8888A0]">
                            <span className="text-[#C06830] shrink-0 mt-0.5">!</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setResult(null); setContext(''); }}
                  className="flex-1 py-2.5 bg-[#1A1A28] text-[#8888A0] text-[11px] font-mono rounded-xl hover:bg-[#1E1E2E] transition-colors"
                >
                  Try another context
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#F7C948]/10 text-[#F7C948] text-[11px] font-mono rounded-xl hover:bg-[#F7C948]/15 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

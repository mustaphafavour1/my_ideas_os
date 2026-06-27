'use client';

import { useState } from 'react';

const QUICK_PROMPTS = [
  'What should I focus on next?',
  'Which idea has the most potential?',
  'Any patterns across my ideas?',
  'Suggest a new idea based on my interests',
];

export function AskBox() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const ask = async (msg: string) => {
    const q = msg || input.trim();
    if (!q) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setResponse(data.response || data.error || 'No response');
      setInput('');
    } catch {
      setResponse('Something went wrong — try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28] flex items-center gap-2">
          <span className="text-[#F7C948] text-sm">✦</span>
          <h2 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">Ask about your ideas</h2>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick prompts */}
          {!response && !loading && (
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => ask(p)}
                  className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-[#1E1E2E] text-[#4A4A60] hover:border-[#F7C948]/20 hover:text-[#8888A0] transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#F7C948]/50 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-mono text-[#3A3A55]">thinking…</span>
            </div>
          )}

          {/* Response */}
          {response && !loading && (
            <div className="bg-[#0D0D18] border border-[#1A1A28] rounded-xl p-4 relative">
              <button
                onClick={() => setResponse(null)}
                className="absolute top-3 right-3 text-[#3A3A55] hover:text-[#5E5E7A] text-[10px]"
              >
                ✕
              </button>
              <p className="text-[12px] text-[#8888A0] leading-relaxed whitespace-pre-wrap pr-4">{response}</p>
            </div>
          )}

          {/* Textarea input */}
          <div className="space-y-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !loading && (e.preventDefault(), ask(input))}
              placeholder="Ask anything about your ideas… (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              rows={3}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl px-4 py-3 text-[12px] text-[#E0E0EA] placeholder-[#2A2A40] focus:outline-none focus:border-[#F7C948]/30 disabled:opacity-50 transition-colors resize-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={() => ask(input)}
                disabled={loading || !input.trim()}
                className="px-5 py-2 bg-[#F7C948] text-[#0A0A0F] text-[11px] font-mono font-semibold rounded-lg hover:bg-[#E6B830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

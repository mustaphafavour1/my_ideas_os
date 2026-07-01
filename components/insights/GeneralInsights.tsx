'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface GeneralInsightsData {
  insights: string[] | null;
  questions: string[] | null;
  generated_at: string | null;
  eligible: boolean;
  ideas_count: number;
  is_paid: boolean;
}

const MIN_IDEAS = 3;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function GeneralInsights() {
  const [data, setData] = useState<GeneralInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/insights/general');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/insights/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || 'Could not generate insights');
      setData((prev) => (prev ? { ...prev, insights: result.insights, questions: result.questions, generated_at: result.generated_at } : prev));
      toast.success('Insights refreshed');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 animate-pulse">
        <div className="h-3 w-32 bg-[#1E1E2E] rounded mb-4" />
        <div className="space-y-2.5">
          <div className="h-3 bg-[#1A1A28] rounded w-full" />
          <div className="h-3 bg-[#1A1A28] rounded w-5/6" />
          <div className="h-3 bg-[#1A1A28] rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasInsights = !!(data.insights && data.insights.length > 0);
  const hasQuestions = !!(data.questions && data.questions.length > 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">General Insights</h2>
        {data.eligible && data.is_paid && hasInsights && (
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1.5 text-[10px] font-mono text-[#3A3A55] hover:text-[#6A6A80] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <svg className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {generating ? 'Refreshing…' : data.generated_at ? `Refresh · updated ${timeAgo(data.generated_at)}` : 'Refresh'}
          </button>
        )}
      </div>

      {!data.eligible ? (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6">
          <p className="text-[12px] text-white/40">
            Sync or add a few more ideas to unlock portfolio-wide insights — {data.ideas_count}/{MIN_IDEAS} so far.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Free-tier users bring their own key — same as syncing — so this feature carries no API cost for us */}
          {!data.is_paid && (
            <div className="rounded-xl border border-[#1E1E2E] bg-[#0A0A0F] p-4 space-y-2.5">
              <div>
                <p className="text-xs font-semibold text-[#F0F0F5]">Your Claude API key</p>
                <p className="text-[11px] text-[#4A4A60] mt-0.5">
                  Used only to generate insights — never sent to or stored on our servers.
                </p>
              </div>
              <input
                type="password"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#111118] border border-[#2A2A3A] rounded-lg px-3 py-2 text-xs text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/40 transition-colors"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" loading={generating} disabled={!apiKey.trim()} onClick={generate}>
                  {hasInsights ? 'Refresh insights' : 'Generate insights'}
                </Button>
                <a
                  href="/#pricing" target="_blank" rel="noopener"
                  className="inline-flex items-center text-[10px] font-semibold text-[#F7C948] border border-[#F7C948]/30 hover:border-[#F7C948]/50 hover:bg-[#F7C948]/5 rounded-md px-2.5 py-1 transition-colors"
                >
                  Upgrade to skip this
                </a>
              </div>
            </div>
          )}

          {!hasInsights && data.is_paid && (
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[12px] text-white/40">
                See the big-picture patterns across all {data.ideas_count} of your ideas — where your energy&apos;s going, what&apos;s working, what isn&apos;t.
              </p>
              <Button size="sm" loading={generating} onClick={generate}>
                Generate insights
              </Button>
            </div>
          )}

          {hasInsights && (
            <div className="grid gap-3">
              {data.insights!.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 items-start bg-gradient-to-br from-[#F7C948]/[0.06] to-transparent border border-[#F7C948]/15 rounded-2xl px-5 py-4"
                >
                  <span className="text-[#F7C948] shrink-0 text-[13px] mt-0.5">✦</span>
                  <p className="text-[13px] text-[#D0D0DA] leading-relaxed">{insight}</p>
                </motion.div>
              ))}
            </div>
          )}

          {hasQuestions && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (data.insights?.length || 0) * 0.05 }}
              className="bg-gradient-to-br from-[#7A7AF0]/[0.06] to-transparent border border-[#7A7AF0]/15 rounded-2xl px-5 py-4"
            >
              <p className="text-[11px] font-semibold text-[#9A9AF5] mb-3">
                The right questions to ask before working on your next idea
              </p>
              <ul className="space-y-2.5">
                {data.questions!.map((question, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <span className="text-[#7A7AF0] shrink-0 text-[11px] mt-0.5">?</span>
                    <p className="text-[13px] text-[#D0D0DA] leading-relaxed">{question}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      )}
    </section>
  );
}

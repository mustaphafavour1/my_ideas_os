'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, PencilSimple, Check, X, DownloadSimple } from '@phosphor-icons/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Idea, UserStats } from '@/lib/types';
import {
  computeProductivityScore, scoreLabel,
  computePersonality, computeTemperament,
} from '@/lib/productivity';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function pages(n: number): string {
  return `~${Math.max(1, Math.round(n / 250))} pages`;
}

function topEntries(items: (string | null)[]): { label: string; count: number }[] {
  const counts: Record<string, number> = {};
  items.forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([label, count]) => ({ label: label.replace(/_/g, ' '), count }));
}

function ScoreRing({ score }: { score: number }) {
  const capped = Math.min(score, 200);
  const r = 42;
  const c = 2 * Math.PI * r;
  const fillFraction = Math.min(1, capped / 100);
  const dash = fillFraction * c;
  const color = '#F7C948';

  return (
    <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
      <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke="#1A1A28" strokeWidth={6} />
        <circle
          cx={48} cy={48} r={r} fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold leading-none" style={{ color }}>{score}%</span>
        <span className="text-[7px] font-mono text-white/50 uppercase tracking-widest mt-0.5">AI score</span>
      </div>
    </div>
  );
}

interface Props {
  ideas: Idea[];
  stats: UserStats | null;
  completed: number;
  inProgress: number;
  completionPct: number;
  monthsExp: number | null;
  topSectors: { label: string; count: number }[];
  initialUsername: string;
}

export function ProfileContent({ ideas, stats, completed, inProgress, completionPct, monthsExp, topSectors, initialUsername }: Props) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState(initialUsername);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(initialUsername);
  const [savingName, setSavingName] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('ideas-os-avatar');
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const processImage = (src: string) =>
      new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 300;
          const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = src;
      });

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const out = file.size > 500 * 1024 ? await processImage(src) : src;
      setAvatar(out);
      localStorage.setItem('ideas-os-avatar', out);
    };
    reader.readAsDataURL(file);
  }, []);

  const saveName = useCallback(async () => {
    const name = tempName.trim();
    if (!name || savingName) return;

    setSavingName(true);
    try {
      const res = await fetch('/api/account/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_username: name }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Could not save name.'); return; }

      setUsername(name);
      setTempName(name);
      setEditingName(false);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSavingName(false);
    }
  }, [tempName, savingName]);

  const downloadCard = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.download = `${username}-ai-profile.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [username, downloading]);

  const score = computeProductivityScore(ideas, stats);
  const label = scoreLabel(score);
  const personality = computePersonality(ideas, stats);
  const temperament = computeTemperament(ideas, stats);
  const topTypes = topEntries(ideas.map((i) => i.idea_type));

  return (
    <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-3xl mx-auto w-full space-y-8">

      {/* ── Profile Card ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest">AI Profile Card</h2>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">Screenshot or download to share</p>
          </div>
          <button
            onClick={downloadCard}
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#111118] border border-[#1E1E2E] hover:border-[#F7C948]/30 hover:text-[#F7C948] rounded-lg text-[11px] font-mono text-[#4A4A60] transition-colors disabled:opacity-40"
          >
            <DownloadSimple size={14} />
            {downloading ? 'Saving…' : 'Download'}
          </button>
        </div>

        {/* Downloadable card */}
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden border border-[#252535]"
          style={{ background: 'linear-gradient(135deg, #0C0C18 0%, #10101E 40%, #0A0A14 100%)' }}
        >
          {/* Glow accents */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #F7C948 0%, transparent 70%)', transform: 'translate(40%, -40%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #7A7AF0 0%, transparent 70%)', transform: 'translate(-40%, 40%)' }} />
          {/* Top stripe */}
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(247,201,72,0.25), transparent)' }} />

          <div className="relative z-10 p-7 sm:p-8">
            {/* Card header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="avatar"
                      className="w-[54px] h-[54px] rounded-full object-cover"
                      style={{ boxShadow: '0 0 0 2px rgba(247,201,72,0.35), 0 0 16px rgba(247,201,72,0.12)' }}
                    />
                  ) : (
                    <div
                      className="w-[54px] h-[54px] rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #F7C948 0%, #C89800 100%)', boxShadow: '0 0 16px rgba(247,201,72,0.2)' }}
                    >
                      <span className="text-[#0A0A0F] font-bold text-xl">{username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={16} className="text-white" />
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                {/* Name + handle */}
                <div>
                  <div className="flex items-center gap-2">
                    {editingName ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          disabled={savingName}
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setTempName(username); } }}
                          className="bg-[#1A1A28] border border-[#F7C948]/30 rounded px-2 py-0.5 text-[16px] font-semibold text-[#F0F0F5] w-36 focus:outline-none disabled:opacity-50"
                        />
                        <button onClick={saveName} disabled={savingName} className="text-[#4CAF82] disabled:opacity-50"><Check size={14} /></button>
                        <button onClick={() => { setEditingName(false); setTempName(username); }} disabled={savingName} className="text-[#C06830] disabled:opacity-50"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <p className="text-[18px] font-bold text-[#F0F0F5] tracking-tight">{username}</p>
                        <button onClick={() => setEditingName(true)} className="text-white/40 hover:text-[#6A6A80] transition-colors">
                          <PencilSimple size={13} />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-white/40 mt-0.5">
                    {monthsExp ? `${monthsExp} Months exp.` : 'AI Builder'}
                  </p>
                </div>
              </div>

              {/* Productivity score ring */}
              <ScoreRing score={score} />
            </div>

            {/* Personality + Temperament + AI Usage — 3 columns on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="flex flex-col gap-1.5">
                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">AI Personality</p>
                <span
                  className="text-[10px] font-mono px-2.5 py-1 rounded-lg tracking-wide self-start"
                  style={{ background: 'rgba(247,201,72,0.1)', color: '#F7C948', border: '1px solid rgba(247,201,72,0.2)' }}
                >
                  {personality.type}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">AI Temperament</p>
                <span
                  className="text-[10px] font-mono px-2.5 py-1 rounded-lg tracking-wide self-start"
                  style={{ background: `${temperament.color}14`, color: temperament.color, border: `1px solid ${temperament.color}30` }}
                >
                  {temperament.name} · {temperament.subtitle}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">AI Usage</p>
                <span
                  className="text-[10px] font-mono px-2.5 py-1 rounded-lg tracking-wide self-start"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#8888A0', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {label}
                </span>
              </div>
            </div>

            {/* Ideas stats */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'Ideas',      value: ideas.length,  accent: '#F7C948' },
                { label: 'Shipped',    value: completed,     accent: '#D0D0DA' },
                { label: 'Completion', value: `${completionPct}%`, accent: '#D0D0DA' },
              ].map(({ label, value, accent }) => (
                <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1.5 whitespace-nowrap">{label}</p>
                  <p className="text-[22px] font-bold leading-none" style={{ color: accent }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Conversation stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Conversations', value: fmt(stats.total_conversations), accent: '#7A7AF0' },
                  { label: 'Words',   value: fmt(stats.total_words),         accent: '#A0A0C0' },
                  { label: 'AI-code Lines', value: fmt(stats.total_code_lines), accent: '#A0A0C0' },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.04]">
                    <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1.5 whitespace-nowrap">{label}</p>
                    <p className="text-[22px] font-bold leading-none" style={{ color: accent }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Top sectors */}
            {topSectors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {[...topSectors, ...topTypes.slice(0, 2)].slice(0, 5).map(({ label }) => (
                  <span key={label} className="text-[9px] font-mono text-[#5E5E7A] bg-white/[0.04] px-2.5 py-1 rounded-lg capitalize border border-white/[0.05]">
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#F7C948] flex items-center justify-center shrink-0">
                  <span className="text-[#0A0A0F] font-bold text-[8px]">IO</span>
                </div>
                <span className="text-[10px] font-mono text-[#4A4A60] tracking-wide">Idea OS</span>
              </div>
              <p className="text-[9px] font-mono text-white/40 tracking-wide">ideas.headfavour.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Productivity Score Breakdown ──────────────────────────── */}
      <section className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28] flex items-center justify-between">
          <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">AI Productivity Score</h3>
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-bold text-[#F7C948]">{score}%</span>
            <span className="text-[10px] font-mono text-white/40">{label}</span>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'AI Conversations',     val: stats?.total_conversations || 0, baseline: 150,   weight: 30 },
            { label: 'Code Lines Generated', val: stats?.total_code_lines    || 0, baseline: 50000, weight: 30 },
            { label: 'Ideas Captured',       val: ideas.length,                   baseline: 250,   weight: 20 },
            { label: 'Execution Rate',       val: completed, baseline: ideas.length || 1, weight: 10, isRate: true },
            { label: 'Depth of Ideas',       val: ideas.filter((i) => i.description).length, baseline: ideas.length || 1, weight: 10, isRate: true },
          ].map(({ label, val, baseline, weight }) => {
            const componentPct = Math.min(100, (val / baseline) * 100);
            const earned = Math.round(componentPct * weight) / 100;
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-[#C0C0D0]">{label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-semibold text-[#F7C948]">{earned.toFixed(1)}%</span>
                    <span className="text-[11px] font-mono text-white/30">/ {weight}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#1A1A28] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${componentPct}%`,
                      background: 'linear-gradient(90deg, #F7C948, rgba(247,201,72,0.4))',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Personality + Temperament ────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
          <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-3">Personality</p>
          <p className="text-[22px] font-bold text-[#F7C948] mb-1">{personality.type}</p>
          <p className="text-[12px] text-[#6A6A80]">{personality.description}</p>
        </div>
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5" style={{ borderColor: `${temperament.color}20` }}>
          <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-3">Temperament</p>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-[22px] font-bold leading-none" style={{ color: temperament.color }}>{temperament.name}</p>
            <p className="text-[12px] font-mono text-[#4A4A60]">{temperament.subtitle}</p>
          </div>
          <p className="text-[12px] text-[#6A6A80]">{temperament.description}</p>
        </div>
      </section>

      {/* ── Idea Breakdown ───────────────────────────────────────── */}
      <section className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28]">
          <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">Idea Breakdown</h3>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Ideas',  value: ideas.length },
            { label: 'In Progress',  value: inProgress },
            { label: 'Completed',    value: completed },
            { label: 'Completion',   value: `${completionPct}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">{label}</p>
              <p className="text-[20px] font-bold text-[#D0D0DA]">{value}</p>
            </div>
          ))}
        </div>
        {topSectors.length > 0 && (
          <div className="px-6 pb-6">
            <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-3">Top Sectors</p>
            <div className="space-y-2">
              {topSectors.map(({ label, count }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-28 h-1.5 bg-[#1A1A28] rounded-full overflow-hidden">
                    <div className="h-full bg-[#F7C948] rounded-full" style={{ width: `${(count / (topSectors[0]?.count || 1)) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-[#8888A0] capitalize">{label}</span>
                  <span className="text-[10px] font-mono text-white/40 ml-auto">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Conversation Stats ───────────────────────────────────── */}
      {stats && (
        <section className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[#1A1A28]">
            <h3 className="text-[11px] font-mono text-[#4A4A60] uppercase tracking-widest">AI Conversation Stats</h3>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Conversations', value: fmt(stats.total_conversations) },
              { label: 'Total Words',   value: fmt(stats.total_words) },
              { label: 'Code Lines',    value: fmt(stats.total_code_lines) },
              { label: 'Code Blocks',   value: fmt(stats.total_code_blocks) },
              { label: 'Human Words',   value: fmt(stats.total_human_words),      sub: pages(stats.total_human_words) },
              { label: 'AI Words',      value: fmt(stats.total_assistant_words),  sub: pages(stats.total_assistant_words) },
            ].map(({ label, value, sub }) => (
              <div key={label}>
                <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-[20px] font-bold text-[#D0D0DA]">{value}</p>
                {sub && <p className="text-[10px] font-mono text-white/30 mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

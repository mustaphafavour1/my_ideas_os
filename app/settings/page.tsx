'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { toast } from 'sonner';

const SETTINGS_KEY = 'ideas-os-settings';

type SectionId = 'stats' | 'recentIdeas' | 'askAI' | 'attention';
type DashboardKey = 'showStats' | 'showRecentIdeas' | 'showAskAI' | 'showNeedsAttention' | 'showAISuggestions';

interface Settings {
  dashboard: {
    showStats: boolean;
    showRecentIdeas: boolean;
    showAskAI: boolean;
    showNeedsAttention: boolean;
    showAISuggestions: boolean;
    order: SectionId[];
  };
}

const DEFAULT_SETTINGS: Settings = {
  dashboard: {
    showStats: true,
    showRecentIdeas: true,
    showAskAI: true,
    showNeedsAttention: true,
    showAISuggestions: true,
    order: ['stats', 'recentIdeas', 'askAI', 'attention'],
  },
};

interface SectionMeta {
  label: string;
  desc: string;
  toggle?: DashboardKey;
  subToggles?: { key: DashboardKey; label: string; desc: string }[];
}

const SECTION_META: Record<SectionId, SectionMeta> = {
  stats: { label: 'Stats Overview', desc: 'Primary metrics and secondary stats', toggle: 'showStats' },
  recentIdeas: { label: 'Recent Ideas', desc: 'Horizontal scroll of your latest ideas', toggle: 'showRecentIdeas' },
  askAI: { label: 'Ask AI', desc: 'Natural language query box', toggle: 'showAskAI' },
  attention: {
    label: 'Needs Attention & AI Suggestions',
    desc: '',
    subToggles: [
      { key: 'showNeedsAttention', label: 'Needs Attention', desc: 'Paused ideas and ideas with blockers' },
      { key: 'showAISuggestions', label: 'AI Suggestions', desc: 'Ideas with AI-generated suggestions' },
    ],
  },
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? 'bg-[#F7C948]' : 'bg-[#1E1E2E]'}`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#0A0A0F] transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
      />
    </button>
  );
}

function GripIcon() {
  return (
    <div className="flex flex-col gap-[3px] shrink-0 cursor-grab active:cursor-grabbing py-0.5">
      <div className="w-[14px] h-px bg-[#2A2A3A]" />
      <div className="w-[14px] h-px bg-[#2A2A3A]" />
      <div className="w-[14px] h-px bg-[#2A2A3A]" />
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const loadedOrder = parsed.dashboard?.order;
        setSettings((s) => ({
          dashboard: {
            ...s.dashboard,
            ...parsed.dashboard,
            order: Array.isArray(loadedOrder) && loadedOrder.length > 0 ? loadedOrder : s.dashboard.order,
          },
        }));
      }
    } catch {}
    setLoaded(true);
  }, []);

  const save = (next: Settings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      toast.success('Settings saved');
    } catch {
      toast.error('Could not save settings');
    }
  };

  const setDash = (key: DashboardKey, val: boolean) => {
    save({ dashboard: { ...settings.dashboard, [key]: val } });
  };

  const reset = () => {
    save(DEFAULT_SETTINGS);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newOrder = [...settings.dashboard.order];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setDragIdx(null);
    setDragOverIdx(null);
    save({ dashboard: { ...settings.dashboard, order: newOrder } });
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  if (!loaded) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar title="Settings" subtitle="Customise your workspace" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-[#3A3A55] font-mono">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Settings" subtitle="Customise your workspace" />

      <main className="flex-1 px-4 lg:px-8 pt-12 pb-10 max-w-3xl mx-auto w-full space-y-10">

        <section>
          <div className="mb-5">
            <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-1">Dashboard</h2>
            <p className="text-[11px] text-[#3A3A55] font-mono">Drag to reorder sections. Toggle to show or hide.</p>
          </div>

          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
            {settings.dashboard.order.map((sectionId, idx) => {
              const meta = SECTION_META[sectionId];
              const isDragging = dragIdx === idx;
              const isDragOver = dragOverIdx === idx && dragIdx !== null && dragIdx !== idx;

              return (
                <div
                  key={sectionId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`border-b border-[#1A1A28] last:border-0 select-none transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'} ${isDragOver ? 'bg-[#161620]' : ''}`}
                >
                  {/* Row header */}
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <GripIcon />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#D0D0DA] font-medium">{meta.label}</p>
                      {meta.desc && <p className="text-[11px] text-[#4A4A60] font-mono mt-0.5">{meta.desc}</p>}
                    </div>
                    {meta.toggle && (
                      <Toggle
                        on={settings.dashboard[meta.toggle]}
                        onChange={(v) => setDash(meta.toggle!, v)}
                      />
                    )}
                  </div>

                  {/* Sub-toggles for the attention section */}
                  {meta.subToggles && (
                    <div className="px-5 pb-3 space-y-2.5 ml-8">
                      {meta.subToggles.map((st) => (
                        <div key={st.key} className="flex items-center justify-between pl-3 border-l border-[#1A1A28]">
                          <div>
                            <p className="text-[11px] text-[#8888A0]">{st.label}</p>
                            <p className="text-[10px] text-[#3A3A55] font-mono mt-0.5">{st.desc}</p>
                          </div>
                          <Toggle on={settings.dashboard[st.key]} onChange={(v) => setDash(st.key, v)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={reset}
            className="text-[11px] font-mono text-[#3A3A55] hover:text-[#C06830] transition-colors"
          >
            Reset all to defaults
          </button>
        </div>

      </main>
    </div>
  );
}

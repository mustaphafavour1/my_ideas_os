'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { toast } from 'sonner';

const SETTINGS_KEY = 'ideas-os-settings';

interface Settings {
  dashboard: {
    showStats: boolean;
    showRecentIdeas: boolean;
    showAskAI: boolean;
    showNeedsAttention: boolean;
    showAISuggestions: boolean;
  };
  table: {
    columns: {
      type: boolean;
      sector: boolean;
      grade: boolean;
      workBegan: boolean;
      lastWorked: boolean;
    };
  };
}

const DEFAULT_SETTINGS: Settings = {
  dashboard: {
    showStats: true,
    showRecentIdeas: true,
    showAskAI: true,
    showNeedsAttention: true,
    showAISuggestions: true,
  },
  table: {
    columns: {
      type: true,
      sector: true,
      grade: true,
      workBegan: true,
      lastWorked: true,
    },
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

function SettingRow({ label, description, on, onChange }: {
  label: string;
  description?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#1A1A28] last:border-0">
      <div className="pr-6">
        <p className="text-[12px] text-[#D0D0DA] font-medium">{label}</p>
        {description && <p className="text-[11px] text-[#4A4A60] font-mono mt-0.5">{description}</p>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings((s) => ({
          dashboard: { ...s.dashboard, ...parsed.dashboard },
          table: { columns: { ...s.table.columns, ...parsed.table?.columns } },
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

  const setDash = (key: keyof Settings['dashboard'], val: boolean) => {
    save({ ...settings, dashboard: { ...settings.dashboard, [key]: val } });
  };

  const setCol = (key: keyof Settings['table']['columns'], val: boolean) => {
    save({ ...settings, table: { columns: { ...settings.table.columns, [key]: val } } });
  };

  const reset = () => {
    save(DEFAULT_SETTINGS);
    toast.success('Settings reset to defaults');
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

      <main className="flex-1 px-4 lg:px-8 py-10 max-w-3xl mx-auto w-full space-y-10">

        {/* Dashboard sections */}
        <section>
          <div className="mb-5">
            <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-1">Dashboard</h2>
            <p className="text-[11px] text-[#3A3A55] font-mono">Show or hide sections on the dashboard.</p>
          </div>
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-5">
            <SettingRow
              label="Stats Overview"
              description="Primary metrics row and secondary stats"
              on={settings.dashboard.showStats}
              onChange={(v) => setDash('showStats', v)}
            />
            <SettingRow
              label="Recent Ideas"
              description="Horizontal scroll of your latest ideas"
              on={settings.dashboard.showRecentIdeas}
              onChange={(v) => setDash('showRecentIdeas', v)}
            />
            <SettingRow
              label="Ask AI"
              description="Natural language query box"
              on={settings.dashboard.showAskAI}
              onChange={(v) => setDash('showAskAI', v)}
            />
            <SettingRow
              label="Needs Attention"
              description="Paused ideas and ideas with blockers"
              on={settings.dashboard.showNeedsAttention}
              onChange={(v) => setDash('showNeedsAttention', v)}
            />
            <SettingRow
              label="AI Suggestions"
              description="Ideas that have AI-generated suggestions"
              on={settings.dashboard.showAISuggestions}
              onChange={(v) => setDash('showAISuggestions', v)}
            />
          </div>
        </section>

        {/* Ideas table columns */}
        <section>
          <div className="mb-5">
            <h2 className="text-[10px] font-mono text-[#4A4A60] uppercase tracking-widest mb-1">Ideas Table</h2>
            <p className="text-[11px] text-[#3A3A55] font-mono">Choose which columns are visible in the ideas table.</p>
          </div>
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-5">
            <SettingRow
              label="Type"
              description="Idea category badge (product, content, etc.)"
              on={settings.table.columns.type}
              onChange={(v) => setCol('type', v)}
            />
            <SettingRow
              label="Sector"
              description="Industry or domain"
              on={settings.table.columns.sector}
              onChange={(v) => setCol('sector', v)}
            />
            <SettingRow
              label="Grade"
              description="Overall AI-assigned grade ring"
              on={settings.table.columns.grade}
              onChange={(v) => setCol('grade', v)}
            />
            <SettingRow
              label="Work Began"
              description="Date of first chat entry"
              on={settings.table.columns.workBegan}
              onChange={(v) => setCol('workBegan', v)}
            />
            <SettingRow
              label="Last Worked"
              description="Most recent update date"
              on={settings.table.columns.lastWorked}
              onChange={(v) => setCol('lastWorked', v)}
            />
          </div>
        </section>

        {/* Reset */}
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

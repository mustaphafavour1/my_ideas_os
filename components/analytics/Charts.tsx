'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import { Idea } from '@/lib/types';

const COLORS = [
  '#F7C948', '#4ADE80', '#5B9BD5', '#9B6BD5', '#FB923C',
  '#4ABDBD', '#F87171', '#A3E635', '#818CF8', '#F472B6', '#34D399', '#60A5FA',
];

const TOOLTIP_STYLE = {
  backgroundColor: '#111118',
  border: '1px solid #1E1E2E',
  borderRadius: '8px',
  color: '#F0F0F5',
  fontSize: 12,
};

interface ChartsProps {
  ideas: Idea[];
}

export function IdeasByTypeChart({ ideas }: ChartsProps) {
  const counts: Record<string, number> = {};
  ideas.forEach((i) => { if (i.idea_type) counts[i.idea_type] = (counts[i.idea_type] || 0) + 1; });
  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  if (data.length === 0) return <EmptyChart label="No type data yet" />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          formatter={(v) => <span style={{ color: '#8888A0', fontSize: 11 }}>{v}</span>}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function IdeasByStatusChart({ ideas }: ChartsProps) {
  const ORDER = ['captured', 'lightly_researched', 'prototyping', 'validated', 'in_progress', 'paused', 'completed', 'archived'];
  const counts: Record<string, number> = {};
  ideas.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
  const data = ORDER.filter((s) => counts[s]).map((s) => ({
    name: s.replace(/_/g, ' '),
    count: counts[s] || 0,
  }));

  if (data.length === 0) return <EmptyChart label="No status data yet" />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#4A4A60', fontSize: 11 }} />
        <YAxis dataKey="name" type="category" tick={{ fill: '#8888A0', fontSize: 11 }} width={110} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#1E1E2E' }} />
        <Bar dataKey="count" fill="#F7C948" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GradeDistributionChart({ ideas }: ChartsProps) {
  const buckets = [
    { range: '1.0–1.9', min: 1, max: 2 },
    { range: '2.0–2.9', min: 2, max: 3 },
    { range: '3.0–3.9', min: 3, max: 4 },
    { range: '4.0–4.9', min: 4, max: 5 },
    { range: '5.0', min: 5, max: 5.1 },
  ];
  const data = buckets.map((b) => ({
    range: b.range,
    count: ideas.filter((i) => i.grade_overall !== null && i.grade_overall >= b.min && i.grade_overall < b.max).length,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
        <XAxis dataKey="range" tick={{ fill: '#4A4A60', fontSize: 11 }} />
        <YAxis tick={{ fill: '#4A4A60', fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#1E1E2E' }} />
        <Bar dataKey="count" fill="#4ADE80" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IdeasTimelineChart({ ideas }: ChartsProps) {
  const byMonth: Record<string, number> = {};
  ideas.forEach((i) => {
    const d = new Date(i.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });
  const data = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      count,
    }));

  if (data.length < 2) return <EmptyChart label="Not enough data for timeline" />;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
        <XAxis dataKey="month" tick={{ fill: '#4A4A60', fontSize: 11 }} />
        <YAxis tick={{ fill: '#4A4A60', fontSize: 11 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line type="monotone" dataKey="count" stroke="#F7C948" strokeWidth={2} dot={{ fill: '#F7C948', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CompletionRing({ ideas }: ChartsProps) {
  const completed = ideas.filter((i) => i.status === 'completed').length;
  const total = ideas.filter((i) => i.status !== 'archived').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 130, height: 130 }}>
        <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={65} cy={65} r={r} fill="none" stroke="#1E1E2E" strokeWidth={10} />
          <circle
            cx={65} cy={65} r={r} fill="none"
            stroke={pct >= 50 ? '#4ADE80' : pct >= 25 ? '#F7C948' : '#F87171'}
            strokeWidth={10}
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#F0F0F5]">{pct}%</span>
          <span className="text-[10px] font-mono text-[#4A4A60]">complete</span>
        </div>
      </div>
      <p className="text-xs text-[#4A4A60] font-mono text-center">{completed} of {total} ideas shipped</p>
    </div>
  );
}

export function TopSectorsChart({ ideas }: ChartsProps) {
  const counts: Record<string, number> = {};
  ideas.forEach((i) => { if (i.sector) counts[i.sector] = (counts[i.sector] || 0) + 1; });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  if (ranked.length === 0) return <EmptyChart label="No sector data yet" />;
  const max = ranked[0][1];

  return (
    <div className="space-y-2">
      {ranked.map(([sector, count], i) => (
        <div key={sector} className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#4A4A60] w-4">{i + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-0.5">
              <span className="text-xs text-[#8888A0] capitalize">{sector}</span>
              <span className="text-xs font-mono text-[#4A4A60]">{count}</span>
            </div>
            <div className="h-1 bg-[#1E1E2E] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F7C948] rounded-full transition-all"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[180px] flex items-center justify-center">
      <p className="text-xs text-[#4A4A60]">{label}</p>
    </div>
  );
}

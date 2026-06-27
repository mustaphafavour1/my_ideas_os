'use client';

import {
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Idea } from '@/lib/types';

const TOOLTIP_STYLE = {
  backgroundColor: '#0D0D18',
  border: '1px solid #1E1E2E',
  borderRadius: '10px',
  color: '#C0C0D0',
  fontSize: 11,
  padding: '8px 12px',
};

interface ChartsProps {
  ideas: Idea[];
}

export function IdeasByTypeChart({ ideas }: ChartsProps) {
  const counts: Record<string, number> = {};
  ideas.forEach((i) => { if (i.idea_type) counts[i.idea_type] = (counts[i.idea_type] || 0) + 1; });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (ranked.length === 0) return <EmptyChart label="No type data yet" />;
  const max = ranked[0][1];

  return (
    <div className="space-y-3">
      {ranked.map(([type, count], idx) => (
        <div key={type} className="flex items-center gap-3 group">
          <span className="text-[10px] font-mono text-[#3A3A55] w-4 text-right shrink-0">{idx + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[11px] font-mono text-[#8888A0] capitalize">{type.replace(/_/g, ' ')}</span>
              <span className="text-[11px] font-mono text-[#4A4A60]">{count}</span>
            </div>
            <div className="h-[3px] bg-[#1A1A28] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: 'linear-gradient(90deg, #F7C948 0%, rgba(247,201,72,0.4) 100%)',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Status pipeline order — graduated shades of yellow from darkest (captured) → full yellow (completed)
// archived is kept dark since it's inactive
const STATUS_ORDER = ['captured', 'lightly_researched', 'prototyping', 'validated', 'in_progress', 'paused', 'completed', 'archived'];
const STATUS_COLORS: Record<string, string> = {
  captured:            '#1E1600',
  lightly_researched:  '#3C2C00',
  prototyping:         '#5C4400',
  validated:           '#7C5C00',
  in_progress:         '#B88A00',
  paused:              '#8A6800',
  completed:           '#F7C948',
  archived:            '#2C2200',
};

export function IdeasByStatusChart({ ideas }: ChartsProps) {
  const counts: Record<string, number> = {};
  ideas.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
  const data = STATUS_ORDER
    .filter((s) => counts[s])
    .map((s) => ({
      name: s.replace(/_/g, ' '),
      value: counts[s] || 0,
      color: STATUS_COLORS[s] || '#F7C948',
    }));

  if (data.length === 0) return <EmptyChart label="No status data yet" />;

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={95}
            paddingAngle={1.5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(10,10,15,0.6)" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[10px] font-mono text-[#5E5E7A] capitalize">{entry.name}</span>
            <span className="text-[10px] font-mono text-[#3A3A55]">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GradeDistributionChart({ ideas }: ChartsProps) {
  const graded = ideas.filter((i) => i.grade_overall !== null);
  const maxVal = Math.max(graded.length, 1);
  // Dynamic max: round up to nearest multiple of 4, minimum 8
  const dataMax = Math.max(8, Math.ceil(maxVal / 4) * 4);

  const buckets = [
    { range: '1–2', min: 1, max: 2 },
    { range: '2–3', min: 2, max: 3 },
    { range: '3–4', min: 3, max: 4 },
    { range: '4–5', min: 4, max: 5 },
    { range: '5', min: 5, max: 5.1 },
  ];
  const data = buckets.map((b) => ({
    range: b.range,
    count: ideas.filter((i) => i.grade_overall !== null && i.grade_overall >= b.min && i.grade_overall < b.max).length,
  }));

  // Generate ticks as multiples of 4 up to dataMax
  const ticks: number[] = [];
  for (let t = 0; t <= dataMax; t += 4) ticks.push(t);

  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} margin={{ top: 12, bottom: 4, left: 4, right: 12 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1A1A28" vertical={false} />
        <XAxis dataKey="range" tick={{ fill: '#3A3A55', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fill: '#3A3A55', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          ticks={ticks}
          domain={[0, dataMax]}
          interval={0}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(247,201,72,0.04)' }} />
        <Bar dataKey="count" fill="#F7C948" radius={[3, 3, 0, 0]} opacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function IdeasTimelineChart({ ideas }: ChartsProps) {
  const byMonth: Record<string, number> = {};
  ideas.forEach((i) => {
    const dateStr = i.chat_date || i.created_at;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
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

  if (data.length === 0) return <EmptyChart label="No timeline data yet" />;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 8 }}>
        <defs>
          <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7C948" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#F7C948" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="#1A1A28" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#3A3A55', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#3A3A55', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: '#2A2A3A', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#F7C948"
          strokeWidth={1.5}
          fill="url(#timelineGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#F7C948', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CompletionRing({ ideas }: ChartsProps) {
  const completed = ideas.filter((i) => i.status === 'completed').length;
  const inProgress = ideas.filter((i) => i.status === 'in_progress').length;
  const total = ideas.filter((i) => i.status !== 'archived').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const strokeColor = pct >= 50 ? '#3AB870' : pct >= 25 ? '#F7C948' : '#C06830';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 130, height: 130 }}>
        <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={65} cy={65} r={r} fill="none" stroke="#1A1A28" strokeWidth={8} />
          <circle
            cx={65} cy={65} r={r} fill="none"
            stroke={strokeColor}
            strokeWidth={8}
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-[28px] font-bold text-[#F0F0F5] leading-none">{pct}%</span>
          <span className="text-[9px] font-mono text-[#3A3A55] tracking-widest uppercase">complete</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-[11px] text-[#4A4A60] font-mono">{completed} of {total} ideas shipped</p>
        {inProgress > 0 && (
          <p className="text-[10px] text-[#F7C948]/60 font-mono">{inProgress} in progress</p>
        )}
      </div>
    </div>
  );
}

export function AvgGradeRing({ ideas }: ChartsProps) {
  const graded = ideas.filter((i) => i.grade_overall !== null);
  const avg = graded.length > 0
    ? graded.reduce((s, i) => s + (i.grade_overall ?? 0), 0) / graded.length
    : 0;
  const pct = (avg / 5) * 100;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const strokeColor = avg >= 4 ? '#3AB870' : avg >= 3 ? '#F7C948' : '#C06830';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 130, height: 130 }}>
        <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={65} cy={65} r={r} fill="none" stroke="#1A1A28" strokeWidth={8} />
          <circle
            cx={65} cy={65} r={r} fill="none"
            stroke={strokeColor}
            strokeWidth={8}
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-[28px] font-bold text-[#F0F0F5] leading-none">{avg > 0 ? avg.toFixed(1) : '—'}</span>
          <span className="text-[9px] font-mono text-[#3A3A55] tracking-widest uppercase">avg grade</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] text-[#4A4A60] font-mono">{graded.length} of {ideas.length} graded</p>
      </div>
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
    <div className="space-y-3">
      {ranked.map(([sector, count], i) => (
        <div key={sector} className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#3A3A55] w-4 text-right shrink-0">{i + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[11px] text-[#8888A0] capitalize font-mono">{sector}</span>
              <span className="text-[11px] font-mono text-[#4A4A60]">{count}</span>
            </div>
            <div className="h-[3px] bg-[#1A1A28] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: 'linear-gradient(90deg, #F7C948 0%, rgba(247,201,72,0.4) 100%)',
                  transition: 'width 0.6s ease',
                }}
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
      <p className="text-[11px] text-[#3A3A55] font-mono">{label}</p>
    </div>
  );
}

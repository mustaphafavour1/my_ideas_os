'use client';

import { motion } from 'framer-motion';
import { DashboardStats } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 card-glow"
    >
      <p className="text-xs font-mono text-[#4A4A60] uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold leading-none mb-1 ${accent ? 'text-[#F7C948]' : 'text-[#F0F0F5]'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#4A4A60]">{sub}</p>}
    </motion.div>
  );
}

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Ideas" value={stats.total} sub="all time" />
      <StatCard label="In Progress" value={stats.in_progress} sub="active now" accent />
      <StatCard label="Completed" value={stats.completed} sub="shipped ✓" />
      <StatCard
        label="Avg Grade"
        value={stats.avg_grade > 0 ? stats.avg_grade.toFixed(1) : '—'}
        sub="across all ideas"
        accent={stats.avg_grade >= 3.5}
      />
    </div>
  );
}

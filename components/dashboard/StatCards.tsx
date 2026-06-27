'use client';

import { motion } from 'framer-motion';
import { DashboardStats } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  index?: number;
}

function StatCard({ label, value, sub, accent, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 relative overflow-hidden card-glow"
    >
      <div
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{
          background: accent
            ? 'linear-gradient(90deg, transparent, rgba(247,201,72,0.3), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
        }}
      />
      <p className="text-[10px] font-mono text-[#3A3A55] uppercase tracking-widest mb-4">{label}</p>
      <p className={`text-[32px] font-bold leading-none mb-2 tracking-tight ${accent ? 'text-[#F7C948]' : 'text-[#E8E8F0]'}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#3A3A55] font-mono">{sub}</p>}
    </motion.div>
  );
}

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard index={0} label="Total Ideas" value={stats.total} sub="all time" />
      <StatCard index={1} label="In Progress" value={stats.in_progress} sub="active now" accent />
      <StatCard index={2} label="Completed" value={stats.completed} sub="shipped" />
      <StatCard
        index={3}
        label="Avg Grade"
        value={stats.avg_grade > 0 ? stats.avg_grade.toFixed(1) : '—'}
        sub="across all ideas"
        accent={stats.avg_grade >= 3.5}
      />
    </div>
  );
}

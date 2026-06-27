'use client';

import { IdeaType } from '@/lib/types';

const TYPE_COLORS: Record<IdeaType, string> = {
  product: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  side_quest: 'bg-purple-950/60 text-purple-300 border-purple-800/50',
  portfolio: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
  content: 'bg-pink-950/60 text-pink-300 border-pink-800/50',
  strategy: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  research: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
  personal_development: 'bg-green-950/60 text-green-300 border-green-800/50',
  automation: 'bg-orange-950/60 text-orange-300 border-orange-800/50',
  community: 'bg-teal-950/60 text-teal-300 border-teal-800/50',
  framework: 'bg-violet-950/60 text-violet-300 border-violet-800/50',
  experiment: 'bg-lime-950/60 text-lime-300 border-lime-800/50',
  partnership: 'bg-rose-950/60 text-rose-300 border-rose-800/50',
};

const TYPE_LABELS: Record<IdeaType, string> = {
  product: 'Product',
  side_quest: 'Side Quest',
  portfolio: 'Portfolio',
  content: 'Content',
  strategy: 'Strategy',
  research: 'Research',
  personal_development: 'Personal Dev',
  automation: 'Automation',
  community: 'Community',
  framework: 'Framework',
  experiment: 'Experiment',
  partnership: 'Partnership',
};

interface BadgeProps {
  type: IdeaType;
  size?: 'sm' | 'md';
}

export function Badge({ type, size = 'md' }: BadgeProps) {
  const colorClass = TYPE_COLORS[type] || 'bg-[#2A2A3A] text-[#8888A0] border-[#3A3A4A]';
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-md border ${colorClass} ${sizeClass}`}
    >
      {TYPE_LABELS[type] || type}
    </span>
  );
}

interface TagBadgeProps {
  label: string;
}

export function TagBadge({ label }: TagBadgeProps) {
  return (
    <span className="inline-flex items-center text-xs font-mono px-2 py-0.5 rounded-md bg-[#1E1E2E] text-[#8888A0] border border-[#2A2A3A]">
      {label}
    </span>
  );
}

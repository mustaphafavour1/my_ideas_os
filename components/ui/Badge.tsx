'use client';

import { IdeaType } from '@/lib/types';

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
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';
  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border bg-[#15151F] text-[#5E5E7A] border-[#252535] ${sizeClass}`}
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
    <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-[#15151F] text-[#5E5E7A] border border-[#252535]">
      {label}
    </span>
  );
}

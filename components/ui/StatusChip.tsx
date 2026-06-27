'use client';

import { IdeaStatus } from '@/lib/types';

const STATUS_CONFIG: Record<IdeaStatus, { label: string; dot: string; text: string }> = {
  captured:          { label: 'Captured',     dot: '#3A3A55', text: '#5E5E7A' },
  lightly_researched:{ label: 'Researched',   dot: '#4A7AB5', text: '#7A9AC5' },
  prototyping:       { label: 'Prototyping',  dot: '#7A50B5', text: '#9A75D5' },
  validated:         { label: 'Validated',    dot: '#38A8A8', text: '#5AC8C8' },
  in_progress:       { label: 'In Progress',  dot: '#F7C948', text: '#F7C948' },
  paused:            { label: 'Paused',       dot: '#D07830', text: '#D07830' },
  completed:         { label: 'Completed',    dot: '#3AB870', text: '#5AD890' },
  archived:          { label: 'Archived',     dot: '#2A2A40', text: '#3A3A55' },
};

interface StatusChipProps {
  status: IdeaStatus;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.captured;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const dotClass = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono ${textSize}`}>
      <span
        className={`${dotClass} rounded-full shrink-0`}
        style={{ backgroundColor: config.dot }}
      />
      <span style={{ color: config.text }}>{config.label}</span>
    </span>
  );
}

'use client';

import { IdeaStatus } from '@/lib/types';

const STATUS_CONFIG: Record<IdeaStatus, { label: string; className: string }> = {
  captured: { label: 'Captured', className: 'bg-[#2A2A3A] text-[#8888A0] border-[#3A3A4A]' },
  lightly_researched: { label: 'Researched', className: 'bg-[#1A2A4A] text-[#5B9BD5] border-[#2A3A5A]' },
  prototyping: { label: 'Prototyping', className: 'bg-[#2A1A4A] text-[#9B6BD5] border-[#3A2A5A]' },
  validated: { label: 'Validated', className: 'bg-[#1A3A3A] text-[#4ABDBD] border-[#2A4A4A]' },
  in_progress: { label: 'In Progress', className: 'bg-[#3A2E0A] text-[#F7C948] border-[#5A4A1A]' },
  paused: { label: 'Paused', className: 'bg-[#3A2A1A] text-[#FB923C] border-[#5A3A2A]' },
  completed: { label: 'Completed', className: 'bg-[#1A3A2A] text-[#4ADE80] border-[#2A4A3A]' },
  archived: { label: 'Archived', className: 'bg-[#1A1A1A] text-[#4A4A60] border-[#2A2A3A]' },
};

interface StatusChipProps {
  status: IdeaStatus;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.captured;
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-md border ${config.className} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}

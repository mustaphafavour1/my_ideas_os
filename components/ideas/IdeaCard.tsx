'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Idea } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { GradeRing } from '@/components/ui/GradeRing';

interface IdeaCardProps {
  idea: Idea;
  showDescription?: boolean;
  baseUrl?: string;
}

export function IdeaCard({ idea, showDescription = false, baseUrl = '/ideas' }: IdeaCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Link href={`${baseUrl}/${idea.id}`} className="block h-full">
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 h-full card-glow hover:border-[#252535] transition-all duration-200">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-[12px] font-semibold text-[#D0D0DA] leading-snug line-clamp-2 flex-1">
              {idea.title}
            </h3>
            <div className="shrink-0">
              <GradeRing grade={idea.grade_overall} size="sm" />
            </div>
          </div>

          {idea.idea_type && (
            <div className="mb-2">
              <Badge type={idea.idea_type} size="sm" />
            </div>
          )}

          {showDescription && idea.description && (
            <p className="text-[11px] text-white/40 truncate mb-2 leading-relaxed">
              {idea.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1">
            {idea.sector && (
              <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                {idea.sector}
              </p>
            )}
            <StatusChip status={idea.status} size="sm" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

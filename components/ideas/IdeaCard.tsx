'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Idea } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { GradeRing } from '@/components/ui/GradeRing';

interface IdeaCardProps {
  idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Link href={`/ideas/${idea.id}`} className="block h-full">
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 h-full card-glow hover:border-[#252535] transition-all duration-200 border-l-[3px] border-l-[#F7C948]/40">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-[13px] font-semibold text-[#E0E0EA] leading-snug line-clamp-2 flex-1">
              {idea.title}
            </h3>
            <div className="shrink-0 mt-0.5">
              <GradeRing grade={idea.grade_overall} size="sm" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {idea.idea_type && <Badge type={idea.idea_type} size="sm" />}
            <StatusChip status={idea.status} size="sm" />
          </div>

          {idea.description && (
            <p className="text-[11px] text-[#4A4A60] line-clamp-2 leading-relaxed">
              {idea.description}
            </p>
          )}

          {idea.sector && (
            <p className="mt-3 text-[10px] font-mono text-[#3A3A55] uppercase tracking-widest">
              {idea.sector}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { StatusChip } from '@/components/ui/StatusChip';
import { Badge, TagBadge } from '@/components/ui/Badge';
import { GradeRing } from '@/components/ui/GradeRing';
import { DEMO_IDEAS } from '@/lib/demo-data';
import { Idea } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

const GRADE_LABELS = [
  { key: 'grade_novelty',          label: 'Novelty' },
  { key: 'grade_feasibility',      label: 'Feasibility' },
  { key: 'grade_personal_fit',     label: 'Personal Fit' },
  { key: 'grade_market_potential', label: 'Market Potential' },
  { key: 'grade_urgency',          label: 'Urgency' },
];

export default async function DemoIdeaDetailPage({ params }: Props) {
  const { id } = await params;
  const idea = DEMO_IDEAS.find((i) => i.id === id) as Idea | undefined;
  if (!idea) notFound();

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title={idea.title}
        subtitle={`${idea.status.replace(/_/g, ' ')} · ${idea.sector || 'no sector'}`}
      />
      <main className="flex-1 px-4 lg:px-8 pt-8 pb-12 max-w-4xl mx-auto w-full space-y-6">

        {/* Back */}
        <Link
          href="/demo/ideas"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to ideas
        </Link>

        {/* Header card */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <StatusChip status={idea.status} />
            {idea.idea_type && <Badge type={idea.idea_type} />}
            {idea.sector && <TagBadge label={idea.sector} />}
          </div>
          <h1 className="text-[20px] font-bold text-[#F0F0F5] leading-snug mb-3">{idea.title}</h1>
          {idea.description && (
            <p className="text-[13px] text-[#7A7A90] leading-relaxed">{idea.description}</p>
          )}
          <p className="text-[10px] font-mono text-white/20 mt-4">
            Captured {new Date(idea.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Grades */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
          <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-5">Grades</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col items-center gap-2">
              <GradeRing grade={idea.grade_overall} size="lg" />
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Overall</span>
            </div>
            <div className="w-px bg-[#1A1A28] self-stretch" />
            {GRADE_LABELS.map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center gap-2">
                <GradeRing grade={idea[key as keyof Idea] as number | null} size="md" />
                <span className="text-[9px] font-mono text-white/40 text-center leading-tight max-w-[56px]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
            <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag) => (
                <span key={tag} className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#1A1A28] text-white/50 border border-[#252535]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Next Steps */}
          {idea.next_steps && idea.next_steps.length > 0 && (
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
              <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">Next Steps</h2>
              <ul className="space-y-2.5">
                {idea.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F7C948]/60 shrink-0 mt-1.5" />
                    <span className="text-[12px] text-[#8888A0] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Blockers */}
          {idea.blockers && idea.blockers.length > 0 && (
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6">
              <h2 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">Blockers</h2>
              <ul className="space-y-2.5">
                {idea.blockers.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C06830]/60 shrink-0 mt-1.5" />
                    <span className="text-[12px] text-[#8888A0] leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Suggestions */}
        {(idea.ai_suggestions || (idea.ai_next_steps && idea.ai_next_steps.length > 0)) && (
          <div className="bg-[#111118] border border-[#F7C948]/10 rounded-xl p-6">
            <h2 className="text-[10px] font-mono text-[#F7C948]/60 uppercase tracking-widest mb-4">AI Suggestions</h2>
            {idea.ai_suggestions && (
              <p className="text-[12px] text-[#8888A0] leading-relaxed mb-4">{idea.ai_suggestions}</p>
            )}
            {idea.ai_next_steps && idea.ai_next_steps.length > 0 && (
              <ul className="space-y-2">
                {idea.ai_next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F7C948]/40 shrink-0 mt-1.5" />
                    <span className="text-[12px] text-[#7A7A90] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Read-only notice */}
        <p className="text-[10px] font-mono text-[#3A3A55] text-center pb-4">
          Demo mode — sign in to edit, add notes, and save signals from your ideas
        </p>

      </main>
    </div>
  );
}

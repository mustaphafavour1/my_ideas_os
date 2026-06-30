import { TopBar } from '@/components/layout/TopBar';
import { DEMO_SIGNALS } from '@/lib/demo-data';
import { SignalType } from '@/lib/types';

const TYPE_CONFIG: Record<SignalType, { label: string; dot: string }> = {
  strategy:    { label: 'Strategy',    dot: '#F7C948' },
  pattern:     { label: 'Pattern',     dot: '#9B6BD5' },
  principle:   { label: 'Principle',   dot: '#5B9BD5' },
  opportunity: { label: 'Opportunity', dot: '#3AB870' },
  risk:        { label: 'Risk',        dot: '#C06830' },
  lesson:      { label: 'Lesson',      dot: '#4ABDBD' },
};

const ORDER: SignalType[] = ['strategy', 'pattern', 'principle', 'opportunity', 'risk', 'lesson'];

export default function DemoSignalsPage() {
  const byType = ORDER.reduce<Partial<Record<SignalType, typeof DEMO_SIGNALS>>>((acc, t) => {
    const group = DEMO_SIGNALS.filter((s) => s.signal_type === t);
    if (group.length) acc[t] = group;
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Signals" subtitle={`${DEMO_SIGNALS.length} extracted signals · demo data`} />
      <main className="flex-1 px-4 lg:px-8 py-8 max-w-5xl mx-auto w-full space-y-8">

        <div className="bg-[#F7C948]/5 border border-[#F7C948]/15 rounded-xl p-5">
          <p className="text-[11px] font-mono text-[#F7C948]/70 uppercase tracking-widest mb-1.5">Demo Signals</p>
          <p className="text-[12px] text-[#7A7A90] leading-relaxed">
            Signals are strategies, patterns, and principles extracted from your ideas.
            Open any idea and click <strong className="text-[#D0D0DA]">Save Signal</strong> to build your personal playbook.
          </p>
        </div>

        {ORDER.filter((t) => byType[t]?.length).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const signals = byType[type]!;
          return (
            <section key={type}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                <h2 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: cfg.dot }}>{cfg.label}</h2>
                <span className="text-[10px] font-mono text-white/30">({signals.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {signals.map((signal) => (
                  <div key={signal.id} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 hover:border-[#252535] transition-colors">
                    <h3 className="text-[13px] font-semibold text-[#D0D0DA] leading-snug mb-2">{signal.title}</h3>
                    <p className="text-[12px] text-[#6A6A80] leading-relaxed">{signal.content}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-white/20">
                        {new Date(signal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[8px] font-mono" style={{ color: cfg.dot }}>{cfg.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

      </main>
    </div>
  );
}

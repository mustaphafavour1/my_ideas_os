const BEST_PRACTICES = [
  { title: 'Give Claude a role and a goal', body: 'Start prompts with who the AI should act as and what outcome you want — it sharply narrows the range of plausible answers.' },
  { title: 'Iterate in the same conversation', body: 'Refining within one thread keeps context intact. Starting fresh loses everything the model already inferred about your project.' },
  { title: 'Ask for options before committing', body: '"Give me 3 approaches, with tradeoffs" surfaces better decisions than jumping straight to one implementation.' },
  { title: 'Paste real errors, not summaries', body: 'The exact stack trace or error message gives far more signal than "it broke" — the model can pattern-match against it directly.' },
  { title: 'Set constraints up front', body: 'Mention your stack, versions, and hard requirements early — it avoids answers you have to discard.' },
  { title: 'Use extended thinking for hard problems', body: 'For genuinely difficult reasoning tasks, models with deeper thinking budgets produce noticeably better plans than a quick single-pass answer.' },
];

const ARTICLES: { title: string; source: string; url: string }[] = [
  { title: 'Anthropic — Prompt engineering overview', source: 'docs.anthropic.com', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview' },
  { title: 'Anthropic — Claude Code best practices', source: 'anthropic.com', url: 'https://www.anthropic.com/engineering/claude-code-best-practices' },
  { title: 'OpenAI — GPT best practices', source: 'platform.openai.com', url: 'https://platform.openai.com/docs/guides/prompt-engineering' },
  { title: 'Google — Prompting guide for Gemini', source: 'ai.google.dev', url: 'https://ai.google.dev/gemini-api/docs/prompting-strategies' },
];

const UPDATE_SOURCES = [
  { name: 'Claude', handle: '@AnthropicAI', url: 'https://twitter.com/AnthropicAI', color: '#F7C948' },
  { name: 'ChatGPT', handle: '@OpenAI', url: 'https://twitter.com/OpenAI', color: '#7A7AF0' },
  { name: 'Gemini', handle: '@GoogleAI', url: 'https://twitter.com/GoogleAI', color: '#4CAF82' },
];

export function TipsAndInfo() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-3">AI best practices</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {BEST_PRACTICES.map((tip) => (
            <div key={tip.title} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4">
              <p className="text-[12.5px] font-semibold text-[#E8E8F0] mb-1.5">{tip.title}</p>
              <p className="text-[11.5px] text-white/45 leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-3">Helpful reading</p>
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl divide-y divide-[#1A1A28]">
          {ARTICLES.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors"
            >
              <div>
                <p className="text-[12px] font-medium text-[#E8E8F0]">{a.title}</p>
                <p className="text-[10px] font-mono text-white/30 mt-0.5">{a.source}</p>
              </div>
              <svg className="w-3.5 h-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest mb-3">Follow for updates</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {UPDATE_SOURCES.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 hover:border-[#2A2A3A] transition-colors flex items-center gap-3"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <div>
                <p className="text-[12px] font-semibold text-[#E8E8F0]">{s.name}</p>
                <p className="text-[10px] font-mono text-white/30">{s.handle}</p>
              </div>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-white/25 mt-3">
          We&apos;ll surface official release notes and announcements from each provider here directly in a future update.
        </p>
      </div>
    </div>
  );
}

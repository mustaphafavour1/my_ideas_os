import { TopBar } from '@/components/layout/TopBar';

const ITEMS = [
  { id: '1', raw_text: 'What if we built a real-time tracker for danfo routes using crowdsourced GPS from commuters? Could completely change how people navigate Lagos transit.', created_at: '2025-11-03T12:10:00Z', processed: true },
  { id: '2', raw_text: 'AI tutor that adapts to individual JAMB curriculum gaps — most students fail not for lack of study but wrong focus areas. Spaced repetition + past questions.', created_at: '2025-10-28T09:22:00Z', processed: true },
  { id: '3', raw_text: 'No-code WhatsApp bot builder for Lagos SMEs — they\'re all already on WA but have zero automation. Drag and drop flow builder, Paystack checkout built in.', created_at: '2025-10-20T14:55:00Z', processed: false },
  { id: '4', raw_text: 'Remote jobs board specifically for African devs — salary transparency in USD, visa guides per country, remote-verified listings only.', created_at: '2025-09-15T11:30:00Z', processed: false },
];

export default function DemoInboxPage() {
  const unprocessed = ITEMS.filter((i) => !i.processed);
  const processed = ITEMS.filter((i) => i.processed);

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Inbox" subtitle={`${unprocessed.length} unprocessed · demo data`} />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-2xl mx-auto w-full space-y-8">

        {/* Capture — disabled in demo */}
        <section>
          <label className="block text-xs font-mono text-[#4A4A60] uppercase tracking-wide mb-3">Drop an idea here</label>
          <textarea
            rows={4}
            disabled
            placeholder="Sign in to capture ideas..."
            className="w-full bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3 text-sm text-[#4A4A60] placeholder-[#3A3A55] resize-none opacity-50 cursor-not-allowed"
          />
          <p className="text-[10px] font-mono text-[#3A3A55] mt-2">Read-only in demo mode · sign in to capture</p>
        </section>

        {/* Unprocessed */}
        {unprocessed.length > 0 && (
          <section>
            <h2 className="text-xs font-mono text-[#4A4A60] uppercase tracking-wide mb-3">
              Unprocessed ({unprocessed.length})
            </h2>
            <div className="space-y-2">
              {unprocessed.map((item) => (
                <div key={item.id} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3">
                  <p className="text-sm text-[#8888A0] leading-relaxed">{item.raw_text}</p>
                  <p className="text-[10px] font-mono text-[#4A4A60] mt-2">
                    {new Date(item.created_at).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Processed */}
        {processed.length > 0 && (
          <section>
            <h2 className="text-xs font-mono text-[#4A4A60] uppercase tracking-wide mb-3">
              Processed ({processed.length})
            </h2>
            <div className="space-y-2 opacity-50">
              {processed.map((item) => (
                <div key={item.id} className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3">
                  <p className="text-sm text-[#4A4A60] leading-relaxed line-clamp-2">{item.raw_text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[#4ADE80]">✓ processed</span>
                    <span className="text-[10px] font-mono text-[#4A4A60]">
                      {new Date(item.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

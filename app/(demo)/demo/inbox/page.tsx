'use client';

import { toast } from 'sonner';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { DEMO_INBOX_ITEMS } from '@/lib/demo-data';

export default function DemoInboxPage() {
  const unprocessed = DEMO_INBOX_ITEMS.filter((i) => !i.processed);
  const processed = DEMO_INBOX_ITEMS.filter((i) => i.processed);

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

        {/* Process button — disabled in demo */}
        {unprocessed.length > 0 && (
          <div className="flex items-center justify-between bg-[#111118] border border-[#1E1E2E] rounded-xl px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[#F0F0F5]">
                {unprocessed.length} item{unprocessed.length !== 1 ? 's' : ''} ready to process
              </p>
              <p className="text-xs text-[#4A4A60] mt-0.5">
                Claude will classify and structure your raw ideas
              </p>
            </div>
            <Button onClick={() => toast.error('Sign in to process your inbox — this is read-only demo data.')}>
              Process Inbox
            </Button>
          </div>
        )}

        {/* Unprocessed items */}
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

        {/* Processed items */}
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

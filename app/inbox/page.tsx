'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { InboxItem } from '@/lib/types';
import { toast } from 'sonner';

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [text, setText] = useState('');

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/inbox');
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setText('');
      toast.success('Idea captured!');
      await fetchItems();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Processing failed');
      toast.success(`Processed ${result.processed} items → ${result.ideas_created} ideas created`);
      await fetchItems();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const unprocessed = items.filter((i) => !i.processed);
  const processed = items.filter((i) => i.processed);

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Inbox"
        subtitle={`${unprocessed.length} unprocessed`}
      />

      <main className="flex-1 px-4 lg:px-8 py-6 max-w-2xl mx-auto w-full space-y-8">
        {/* Quick capture */}
        <section>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-mono text-[#4A4A60] uppercase tracking-wide">
              Drop an idea here
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="One line or a paragraph, anything — a product idea, a random thought, something you want to explore..."
              className="w-full bg-[#111118] border border-[#1E1E2E] focus:border-[#F7C948]/40 rounded-xl px-4 py-3 text-sm text-[#F0F0F5] placeholder-[#4A4A60] resize-none focus:outline-none transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#4A4A60]">⌘+Enter to submit</span>
              <Button type="submit" loading={submitting}>
                Capture Idea
              </Button>
            </div>
          </form>
        </section>

        {/* Process button */}
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
            <Button loading={processing} onClick={handleProcess}>
              Process Inbox
            </Button>
          </div>
        )}

        {/* Unprocessed items */}
        <AnimatePresence>
          {!loading && unprocessed.length > 0 && (
            <section>
              <h2 className="text-xs font-mono text-[#4A4A60] uppercase tracking-wide mb-3">
                Unprocessed ({unprocessed.length})
              </h2>
              <div className="space-y-2">
                {unprocessed.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#111118] border border-[#1E1E2E] rounded-xl px-4 py-3"
                  >
                    <p className="text-sm text-[#8888A0] leading-relaxed">{item.raw_text}</p>
                    <p className="text-[10px] font-mono text-[#4A4A60] mt-2">
                      {new Date(item.created_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </AnimatePresence>

        {/* Processed items */}
        {processed.length > 0 && (
          <section>
            <h2 className="text-xs font-mono text-[#4A4A60] uppercase tracking-wide mb-3">
              Processed ({processed.length})
            </h2>
            <div className="space-y-2 opacity-50">
              {processed.slice(0, 10).map((item) => (
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

        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#4A4A60] text-sm">Your inbox is empty</p>
            <p className="text-xs text-[#4A4A60] mt-1">Drop a quick idea above whenever inspiration hits</p>
          </div>
        )}
      </main>
    </div>
  );
}

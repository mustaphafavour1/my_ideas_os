'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { SyncResult } from '@/lib/types';

interface SyncUploaderProps {
  onComplete?: (result: SyncResult) => void;
  userPlan?: string | null;
}

type FileStatus = 'pending' | 'processing' | 'done' | 'error';

interface FileEntry {
  name: string;
  content: string;
  status: FileStatus;
  error?: string;
  subLabel?: string;
  progress?: number;
  progressLabel?: string;
}

interface ClientConversation {
  uuid: string;
  name: string;
  created_at: string;
  fullText: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractOldMsgText(m: any): string {
  if (typeof m.text === 'string' && m.text.trim()) return m.text.trim();
  if (Array.isArray(m.content)) {
    return m.content.filter((c: any) => c.type === 'text' && c.text?.trim()).map((c: any) => c.text).join('\n').trim();
  }
  if (typeof m.content === 'string' && m.content.trim()) return m.content.trim();
  return '';
}

function extractNewMsgText(m: any): string {
  const parts: string[] = [];
  if (typeof m.content?.content === 'string' && m.content.content.trim()) {
    parts.push(m.content.content.trim());
  }
  if (Array.isArray(m.content?.contentBlocks)) {
    for (const b of m.content.contentBlocks) {
      if (b.type === 'text' && b.text?.trim()) parts.push(b.text.trim());
    }
  }
  if (parts.length === 0 && Array.isArray(m.content?.attachments)) {
    for (const a of m.content.attachments) {
      if (a.content?.trim()) parts.push(a.content.trim().slice(0, 3000));
    }
  }
  return parts.join('\n\n');
}

function parseConversationsClient(content: string): ClientConversation[] {
  try {
    const data = JSON.parse(content);
    const results: ClientConversation[] = [];

    function parseItem(item: any, idx: number): ClientConversation | null {
      if (!item || typeof item !== 'object') return null;

      // Old format: chat_messages array
      if (Array.isArray(item.chat_messages) && item.chat_messages.length > 0) {
        const fullText = item.chat_messages
          .map((m: any) => { const t = extractOldMsgText(m); return t ? `[${m.sender}]: ${t}` : null; })
          .filter(Boolean).join('\n\n');
        if (fullText.trim().length <= 50) return null;
        return { uuid: item.uuid || `unknown-${Date.now()}-${idx}`, name: item.name || 'Unnamed', created_at: item.created_at || new Date().toISOString(), fullText };
      }

      // New format: messages array (Projects / Design chats)
      if (Array.isArray(item.messages) && item.messages.length > 0) {
        const fullText = item.messages
          .map((m: any) => { const t = extractNewMsgText(m); return t ? `[${m.role}]: ${t}` : null; })
          .filter(Boolean).join('\n\n');
        if (fullText.trim().length <= 50) return null;
        const name = item.title || item.name || item.project?.name || 'Unnamed';
        return { uuid: item.uuid || `unknown-${Date.now()}-${idx}`, name, created_at: item.created_at || new Date().toISOString(), fullText };
      }

      return null;
    }

    if (Array.isArray(data)) {
      data.forEach((item, i) => { const p = parseItem(item, i); if (p) results.push(p); });
    } else if (data?.conversations && Array.isArray(data.conversations)) {
      data.conversations.forEach((item: any, i: number) => { const p = parseItem(item, i); if (p) results.push(p); });
    } else {
      const p = parseItem(data, 0);
      if (p) results.push(p);
    }

    return results;
  } catch {
    return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const BATCH_SIZE = 8;

const PAID_PLANS = new Set(['one-time', 'monthly', 'enterprise']);

export function SyncUploader({ onComplete, userPlan }: SyncUploaderProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // API key — ephemeral, held only in component state, never persisted
  const [apiKey, setApiKey] = useState('');
  const isPaid = PAID_PLANS.has(userPlan ?? '');

  const readFiles = useCallback((rawFiles: File[]) => {
    const jsonFiles = rawFiles.filter((f) => f.name.endsWith('.json'));
    if (jsonFiles.length === 0) {
      toast.error('Please drop JSON files only (.json)');
      return;
    }

    const readers = jsonFiles.map(
      (file) =>
        new Promise<FileEntry>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve({ name: file.name, content: e.target?.result as string, status: 'pending' });
          reader.onerror = () =>
            resolve({ name: file.name, content: '', status: 'error', error: 'Could not read file' });
          reader.readAsText(file);
        })
    );

    Promise.all(readers).then((entries) => {
      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const newEntries = entries.filter((e) => !existingNames.has(e.name));
        return [...prev, ...newEntries];
      });
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      readFiles(Array.from(e.dataTransfer.files));
    },
    [readFiles]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) readFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const runSync = async () => {
    const pending = files.filter((f) => f.status === 'pending' && f.content);
    if (pending.length === 0) return;

    if (!isPaid && !apiKey.trim()) {
      toast.error('Enter your Claude API key first, or upgrade to a paid plan.');
      return;
    }

    const apiKeyHeader = !isPaid ? apiKey.trim() : undefined;

    setSyncing(true);
    let totalAdded = 0, totalUpdated = 0, totalSkipped = 0, totalAlreadySynced = 0;

    for (const file of pending) {
      const conversations = parseConversationsClient(file.content);

      if (conversations.length === 0) {
        // Valid JSON but no parseable conversations — let server decide
        setFiles((prev) =>
          prev.map((f) => f.name === file.name ? { ...f, status: 'processing', progress: 0, progressLabel: 'Validating…' } : f)
        );
        try {
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationJson: file.content, ...(apiKeyHeader ? { apiKey: apiKeyHeader } : {}) }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Sync failed');

          totalAdded += result.added ?? 0;
          totalUpdated += result.updated ?? 0;
          totalSkipped += result.skipped ?? 0;
          totalAlreadySynced += result.already_synced ?? 0;

          setFiles((prev) =>
            prev.map((f) => f.name === file.name ? { ...f, status: 'done', progress: 100, subLabel: result.message || 'No conversations found' } : f)
          );
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) => f.name === file.name ? { ...f, status: 'error', error: (err as Error).message } : f)
          );
        }
        continue;
      }

      // Split into batches for progress tracking
      const batches: ClientConversation[][] = [];
      for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
        batches.push(conversations.slice(i, i + BATCH_SIZE));
      }
      const totalBatches = batches.length;

      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: 'processing', progress: 0, progressLabel: `Batch 1/${totalBatches} · 0%` }
            : f
        )
      );

      let fileAdded = 0, fileUpdated = 0, fileSkipped = 0, fileAlreadySynced = 0;
      let hadError = false;

      for (let i = 0; i < batches.length; i++) {
        // Update label BEFORE the call so the user sees which batch is being analysed
        const prePct = Math.round((i / totalBatches) * 100);
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, progress: prePct, progressLabel: `Batch ${i + 1}/${totalBatches} · Analysing conversations…` }
              : f
          )
        );

        try {
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationBatch: batches[i], ...(apiKeyHeader ? { apiKey: apiKeyHeader } : {}) }),
          });

          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Sync failed');

          fileAdded += result.added ?? 0;
          fileUpdated += result.updated ?? 0;
          fileSkipped += result.skipped ?? 0;
          fileAlreadySynced += result.already_synced ?? 0;

          const done = i + 1;
          const pct = Math.round((done / totalBatches) * 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? {
                    ...f,
                    progress: pct,
                    progressLabel: done < totalBatches
                      ? `Batch ${done}/${totalBatches} · ${pct}%`
                      : `Finalising · ${pct}%`,
                  }
                : f
            )
          );
        } catch (err) {
          hadError = true;
          setFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, status: 'error', error: (err as Error).message }
                : f
            )
          );
          break;
        }
      }

      if (!hadError) {
        totalAdded += fileAdded;
        totalUpdated += fileUpdated;
        totalSkipped += fileSkipped;
        totalAlreadySynced += fileAlreadySynced;

        const subLabel =
          fileAlreadySynced > 0 && fileAdded === 0 && fileUpdated === 0
            ? `done — ${fileAlreadySynced} conversation(s) already synced`
            : fileAdded > 0 || fileUpdated > 0
            ? `${fileAdded} added${fileUpdated > 0 ? `, ${fileUpdated} updated` : ''}`
            : 'Synced — no new ideas found';

        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: 'done', subLabel, progress: 100 } : f
          )
        );
      }
    }

    setSyncing(false);

    const parts = [];
    if (totalAdded > 0) parts.push(`${totalAdded} new idea${totalAdded !== 1 ? 's' : ''}`);
    if (totalUpdated > 0) parts.push(`${totalUpdated} updated`);
    if (totalAlreadySynced > 0) parts.push(`${totalAlreadySynced} conversations already synced`);
    if (parts.length === 0) parts.push('nothing new to add');

    toast.success(`Sync complete — ${parts.join(', ')}`, { duration: 5000 });
    onComplete?.({ added: totalAdded, updated: totalUpdated, skipped: totalSkipped, total: totalAdded + totalUpdated });
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* API key input — shown for free / unpaid users */}
      {!isPaid && (
        <div className="rounded-xl border border-[#1E1E2E] bg-[#0A0A0F] p-4 space-y-2.5">
          <div>
            <p className="text-xs font-semibold text-[#F0F0F5]">Your Claude API key</p>
            <p className="text-[11px] text-[#4A4A60] mt-0.5">
              Used only for this sync — never sent to or stored on our servers.
            </p>
          </div>
          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-[#111118] border border-[#2A2A3A] rounded-lg px-3 py-2 text-xs text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/40 transition-colors"
          />
          <p className="text-[10px] text-[#3A3A55]">
            Don&apos;t have a key?{' '}
            <a href="/#pricing" target="_blank" rel="noopener" className="text-[#F7C948]/70 hover:text-[#F7C948] underline transition-colors">
              Upgrade to a paid plan
            </a>{' '}
            and we&apos;ll handle the API for you.
          </p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-[#F7C948] bg-[#F7C948]/5'
            : 'border-[#2A2A3A] hover:border-[#F7C948]/40 hover:bg-[#F7C948]/3'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={onFileInput}
        />

        <AnimatePresence mode="wait">
          {dragging ? (
            <motion.div
              key="dropping"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-lg font-semibold text-[#F7C948]">Drop to add</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-10 h-10 rounded-xl bg-[#1E1E2E] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#4A4A60]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#F0F0F5] mb-1">
                Drop your Claude export files here
              </p>
              <p className="text-xs text-[#4A4A60]">
                or click to browse — accepts multiple .json files
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* How to export hint */}
      <details className="group">
        <summary className="text-xs text-[#4A4A60] cursor-pointer hover:text-[#8888A0] transition-colors list-none flex items-center gap-1">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          How to export from Claude
        </summary>
        <div className="mt-2 pl-4 space-y-1 text-xs text-[#4A4A60] border-l border-[#1E1E2E]">
          <p>1. Go to <span className="text-[#8888A0]">claude.ai</span> → click your avatar → <span className="text-[#8888A0]">Settings</span></p>
          <p>2. Scroll to <span className="text-[#8888A0]">Data export</span> → click <span className="text-[#8888A0]">Export data</span></p>
          <p>3. Wait for the email, download the ZIP</p>
          <p>4. Extract the ZIP → find <span className="font-mono text-[#8888A0]">conversations.json</span></p>
          <p>5. Drop it here — you can add multiple exports at once</p>
        </div>
      </details>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 max-h-[280px] overflow-y-auto pr-1"
          >
            {files.map((file) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                    {file.status === 'pending' && (
                      <div className="w-2 h-2 rounded-full bg-[#4A4A60]" />
                    )}
                    {file.status === 'processing' && (
                      <svg className="w-4 h-4 animate-spin text-[#F7C948]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {file.status === 'done' && (
                      <svg className="w-4 h-4 text-[#4ADE80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {file.status === 'error' && (
                      <svg className="w-4 h-4 text-[#F87171]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[#F0F0F5] truncate">{file.name}</p>
                    {file.error && (
                      <p className="text-[10px] text-[#F87171] mt-0.5">{file.error}</p>
                    )}
                    {file.status === 'processing' && (
                      <p className="text-[10px] text-[#F7C948] mt-0.5 font-mono">
                        {file.progressLabel || 'Analysing with Claude…'}
                      </p>
                    )}
                    {file.status === 'done' && (
                      <p className="text-[10px] text-[#4ADE80] mt-0.5">
                        {file.subLabel || 'Synced successfully'}
                      </p>
                    )}
                  </div>

                  {file.status === 'pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                      className="shrink-0 text-[#4A4A60] hover:text-[#F87171] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {file.status === 'processing' && typeof file.progress === 'number' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1E1E2E]">
                    <motion.div
                      className="h-full bg-[#F7C948]"
                      initial={{ width: '0%' }}
                      animate={{ width: `${file.progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action row */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#4A4A60] font-mono">
            {pendingCount} file{pendingCount !== 1 ? 's' : ''} ready
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFiles([])}
              disabled={syncing}
            >
              Clear all
            </Button>
            <Button
              size="sm"
              loading={syncing}
              onClick={runSync}
            >
              {syncing ? 'Processing…' : `Sync ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SyncUploader } from '@/components/sync/SyncUploader';

interface TopBarProps {
  title: string;
  subtitle?: React.ReactNode;
  lastSynced?: string | null;
}

export function TopBar({ title, subtitle, lastSynced }: TopBarProps) {
  const [showSync, setShowSync] = useState(false);

  const formatLastSynced = (ts: string | null | undefined) => {
    if (!ts) return 'Never synced';
    const d = new Date(ts);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-[#1E1E2E]">
        <div className="flex items-center justify-between px-4 lg:px-8 h-14">
          <div>
            <h1 className="text-[13px] font-semibold text-[#D0D0DA] leading-tight tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-[10px] text-[#3A3A55] font-mono mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {lastSynced !== undefined && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hidden sm:block text-[11px] font-mono text-[#4A4A60]"
                >
                  {formatLastSynced(lastSynced)}
                </motion.span>
              )}
            </AnimatePresence>

            <Button size="sm" onClick={() => setShowSync(true)}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync
            </Button>
          </div>
        </div>
      </header>

      <Modal
        open={showSync}
        onClose={() => setShowSync(false)}
        title="Sync Ideas from Claude"
        width="lg"
      >
        <SyncUploader onComplete={() => setShowSync(false)} />
      </Modal>
    </>
  );
}

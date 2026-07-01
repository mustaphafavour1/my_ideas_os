'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SyncUploader } from '@/components/sync/SyncUploader';
import { UpgradeModal } from '@/components/dashboard/UpgradeModal';

const PAID_PLANS = new Set(['one-time', 'monthly', 'enterprise']);

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopBarProps {
  title: string;
  subtitle?: React.ReactNode;
  lastSynced?: string | null;
  userPlan?: string | null;
}

export function TopBar({ title, subtitle, lastSynced, userPlan }: TopBarProps) {
  const [showSync, setShowSync] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isPaid = PAID_PLANS.has(userPlan ?? '');

  const formatLastSynced = (ts: string | null | undefined) => {
    if (!ts) return null;
    const d = new Date(ts);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const syncLabel = formatLastSynced(lastSynced);

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-[#1E1E2E]">
        <div className="flex items-center justify-between px-4 lg:px-8 h-[70px]">
          <div className="flex flex-col justify-center gap-0.5">
            <h1 className="text-[13px] font-semibold text-[#D0D0DA] leading-tight tracking-tight line-clamp-1">{title}</h1>
            {subtitle && (
              <p className="text-[10px] text-[#3A3A55] font-mono">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {syncLabel && (
                <motion.span
                  key={syncLabel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hidden sm:block text-[10px] font-mono text-[#3A3A55]"
                >
                  {syncLabel}
                </motion.span>
              )}
            </AnimatePresence>

            {!isPaid && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="text-[11px] font-semibold text-[#F7C948] hover:text-[#F7C948]/80 border border-[#F7C948]/30 hover:border-[#F7C948]/50 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                Upgrade
              </button>
            )}

            <Button size="sm" onClick={() => setShowSync(true)}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <SyncUploader
          onComplete={() => setShowSync(false)}
          userPlan={userPlan}
          onUpgradeClick={() => { setShowSync(false); setShowUpgrade(true); }}
        />
      </Modal>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}

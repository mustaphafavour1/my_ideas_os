'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { IdeaTable } from '@/components/ideas/IdeaTable';
import { AddIdeaForm } from '@/components/ideas/AddIdeaForm';
import { Modal } from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Idea } from '@/lib/types';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ideas');
      const data = await res.json();
      setIdeas(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Ideas" />

      <main className="flex-1 px-4 lg:px-8 pt-10 pb-6 max-w-6xl mx-auto w-full">
        {/* Count header outside TopBar */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#E8E8F0] leading-none">
              {loading ? '—' : ideas.length}
            </h2>
            <p className="text-[11px] font-mono text-[#3A3A55] mt-1">
              {loading ? 'Loading…' : `idea${ideas.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#F7C948] text-[#0A0A0F] text-[12px] font-semibold rounded-lg hover:bg-[#E6B830] transition-colors"
          >
            + New Idea
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)}
            </motion.div>
          ) : (
            <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <IdeaTable
                ideas={ideas}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Idea" width="md">
        <AddIdeaForm
          onSuccess={() => { setShowAdd(false); fetchIdeas(); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

export function HowToExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'claude' | 'chatgpt'>('claude');

  return (
    <Modal open={open} onClose={onClose} title="How to export your conversations" width="md">
      <div className="flex gap-2 mb-4">
        {(['claude', 'chatgpt'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors border cursor-pointer ${
              tab === t ? 'bg-[#F7C948]/10 border-[#F7C948]/40 text-[#F7C948]' : 'border-[#1E1E2E] text-white/40 hover:text-white/60'
            }`}>
            {t === 'claude' ? 'Claude' : 'ChatGPT'}
          </button>
        ))}
      </div>

      {tab === 'claude' ? (
        <div className="space-y-2 text-xs text-[#8888A0] leading-relaxed">
          <p>1. Go to <span className="text-[#F0F0F5]">claude.ai</span> → click your avatar → <span className="text-[#F0F0F5]">Settings</span></p>
          <p>2. Scroll to <span className="text-[#F0F0F5]">Data export</span> → click <span className="text-[#F0F0F5]">Export data</span></p>
          <p>3. Wait for the email, then download the ZIP</p>
          <p>4. Extract the ZIP → find <span className="font-mono text-[#F0F0F5]">conversations.json</span></p>
          <p>5. Drop it in the uploader — you can add multiple exports at once</p>
        </div>
      ) : (
        <div className="space-y-2 text-xs text-[#8888A0] leading-relaxed">
          <p>1. Go to <span className="text-[#F0F0F5]">chatgpt.com</span> → click your name → <span className="text-[#F0F0F5]">Settings</span></p>
          <p>2. Go to <span className="text-[#F0F0F5]">Data controls</span> → click <span className="text-[#F0F0F5]">Export data</span></p>
          <p>3. Confirm the export, wait for the email, then download the ZIP</p>
          <p>4. Extract the ZIP → find <span className="font-mono text-[#F0F0F5]">conversations.json</span></p>
          <p>5. Drop it in the uploader — you can add multiple exports at once</p>
        </div>
      )}
    </Modal>
  );
}

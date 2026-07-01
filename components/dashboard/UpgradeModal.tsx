'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'one-time' }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }
      setError(data.error || 'Could not start checkout.');
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upgrade to full access" width="md">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#F7C948]/40 bg-[#F7C948]/5 p-5 flex flex-col">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-1">Best value</p>
          <p className="text-[26px] font-bold text-white leading-none mb-1">$3</p>
          <p className="text-[11px] text-white/40 mb-4">one-time</p>
          <ul className="text-[12px] text-white/60 space-y-1.5 mb-5 flex-1">
            <li>Analyse up to 150 conversations</li>
            <li>Full idea intelligence &amp; grading</li>
            <li>Analytics &amp; productivity score</li>
            <li>No API key needed</li>
          </ul>

          {error && <p className="text-[11px] text-[#F87171] mb-3">{error}</p>}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-10 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[12px] font-bold hover:bg-[#E6B830] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
                Redirecting…
              </>
            ) : (
              'Get full access — via Paystack'
            )}
          </button>
        </div>

        <div className="rounded-xl border border-[#1E1E2E] bg-[#0A0A0F] p-5 flex flex-col opacity-60">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Monthly</p>
          <p className="text-[26px] font-bold text-white leading-none mb-1">$10</p>
          <p className="text-[11px] text-white/40 mb-4">/month</p>
          <ul className="text-[12px] text-white/40 space-y-1.5 mb-5 flex-1">
            <li>Everything in One-time</li>
            <li>4 syncs per month</li>
            <li>Unlimited total conversations</li>
          </ul>
          <span className="w-full h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center border border-[#1E1E2E] text-white/25 cursor-not-allowed select-none">
            Coming soon
          </span>
        </div>
      </div>
    </Modal>
  );
}

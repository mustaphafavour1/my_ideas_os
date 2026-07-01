'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    id: 'one-time',
    label: 'Best value',
    price: '$3',
    period: 'one-time',
    features: [
      'Analyse up to 150 conversations',
      'Full idea intelligence & grading',
      'Analytics & productivity score',
      'No API key needed',
    ],
    cta: 'Get full access',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$10',
    period: '/month',
    features: [
      'Everything in One-time',
      '4 syncs per month (weekly)',
      'Unlimited total conversations',
      'Priority support',
    ],
    cta: 'Subscribe',
  },
] as const;

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [gateway, setGateway] = useState<'paystack' | 'lemonsqueezy'>('paystack');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleUpgrade = async (planId: string) => {
    setLoadingPlan(planId);
    setError('');
    try {
      const res = await fetch(`/api/payment/${gateway}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      const url = data.authorization_url || data.url;
      if (url) {
        window.location.assign(url);
        return;
      }
      setError(data.error || 'Could not start checkout.');
      setLoadingPlan(null);
    } catch {
      setError('Network error. Please try again.');
      setLoadingPlan(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upgrade to full access" width="lg">
      {/* Gateway tabs */}
      <div className="flex gap-2 mb-4">
        {(['paystack', 'lemonsqueezy'] as const).map((g) => (
          <button key={g} onClick={() => setGateway(g)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors border cursor-pointer ${
              gateway === g ? 'bg-[#F7C948]/10 border-[#F7C948]/40 text-[#F7C948]' : 'border-[#1E1E2E] text-white/40 hover:text-white/60'
            }`}>
            {g === 'paystack' ? 'Paystack' : 'Lemon Squeezy'}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-white/25 font-mono mb-4">
        {gateway === 'paystack' ? 'Charged in Naira — cards, bank transfer, USSD' : 'Supports cards worldwide, PayPal'}
      </p>

      {error && <p className="text-[11px] text-[#F87171] mb-3">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`rounded-xl border p-5 flex flex-col ${
            p.id === 'one-time' ? 'border-[#F7C948]/40 bg-[#F7C948]/5' : 'border-[#1E1E2E] bg-[#0A0A0F]'
          }`}>
            <p className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${p.id === 'one-time' ? 'text-[#F7C948]' : 'text-white/40'}`}>{p.label}</p>
            <p className="text-[26px] font-bold text-white leading-none mb-1">{p.price}</p>
            <p className="text-[11px] text-white/40 mb-4">{p.period}</p>
            <ul className="text-[12px] text-white/60 space-y-1.5 mb-5 flex-1">
              {p.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <button
              onClick={() => handleUpgrade(p.id)}
              disabled={loadingPlan !== null}
              className={`w-full h-10 rounded-xl text-[12px] font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer ${
                p.id === 'one-time' ? 'bg-[#F7C948] text-[#0A0A0F] hover:bg-[#E6B830]' : 'border border-[#1E1E2E] text-white/70 hover:border-[#2A2A3A]'
              }`}
            >
              {loadingPlan === p.id ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Redirecting…
                </>
              ) : (
                p.cta
              )}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

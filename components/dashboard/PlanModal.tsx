'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface PlanDetails {
  plan: string | null;
  plan_updated_at: string | null;
  subscription_end: string | null;
  analysis_credits: number | null;
  last_payment: { created_at: string; provider: string; plan: string; amount_cents: number; currency: string } | null;
}

const PLAN_LABELS: Record<string, string> = {
  demo: 'Demo',
  free: 'Free (own API key)',
  'one-time': 'One-time ($3)',
  monthly: 'Monthly ($10/mo)',
  enterprise: 'Enterprise',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface PlanModalProps {
  open: boolean;
  onClose: () => void;
  onUpgradeToMonthly: () => void;
}

export function PlanModal({ open, onClose, onUpgradeToMonthly }: PlanModalProps) {
  const [details, setDetails] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      if (!open) return;
      setLoading(true);
      fetch('/api/account/plan')
        .then((r) => r.json())
        .then((d) => { setDetails(d); setLoading(false); })
        .catch(() => setLoading(false));
    };
    load();
  }, [open]);

  const pending = details?.plan === 'monthly' && !!details.subscription_end && new Date(details.subscription_end) < new Date();

  return (
    <Modal open={open} onClose={onClose} title="Your plan" width="sm">
      {loading ? (
        <div className="space-y-3">
          <div className="h-5 w-2/3 bg-[#1E1E2E] rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-[#1E1E2E] rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-[#1E1E2E] rounded animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Current plan</p>
            <p className="text-[18px] font-bold text-[#F7C948]">
              {(details?.plan && PLAN_LABELS[details.plan]) || details?.plan || '—'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-1">Subscribed</p>
              <p className="text-white/70">{fmtDate(details?.plan_updated_at ?? null)}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-1">Last payment</p>
              <p className="text-white/70">{fmtDate(details?.last_payment?.created_at ?? null)}</p>
            </div>
          </div>

          {details?.plan === 'monthly' && (
            <div className={`rounded-lg border px-3 py-2 text-[11px] ${
              pending ? 'border-[#F87171]/30 bg-[#F87171]/5 text-[#F87171]' : 'border-[#1E1E2E] text-white/50'
            }`}>
              {pending
                ? 'Payment pending — your subscription has expired.'
                : `Renews ${fmtDate(details.subscription_end)}`}
            </div>
          )}

          {details?.plan === 'one-time' && (
            <button
              onClick={onUpgradeToMonthly}
              className="w-full h-10 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[12px] font-bold hover:bg-[#E6B830] transition-colors cursor-pointer"
            >
              Subscribe to Monthly
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

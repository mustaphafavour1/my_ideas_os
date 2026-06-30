'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutPage() {
  const params = useSearchParams();
  const plan    = params.get('plan') || '';
  const gateway = params.get('gateway') || 'paystack';
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plan) { setError('No plan selected.'); return; }

    fetch(`/api/payment/${gateway}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then((r) => r.json())
      .then((data) => {
        const url = data.authorization_url || data.url;
        if (url) {
          window.location.href = url;
        } else {
          setError(data.error || 'Could not create checkout. Please try again.');
        }
      })
      .catch(() => setError('Network error. Please try again.'));
  }, [plan, gateway]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#F87171] text-sm mb-4">{error}</p>
          <a href="/#pricing" className="text-[#F7C948] text-sm underline">Back to pricing</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#F7C948]/30 border-t-[#F7C948] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#F0F0F5] text-sm font-medium">Setting up your checkout…</p>
        <p className="text-[#4A4A60] text-xs mt-1">You'll be redirected to the payment page shortly.</p>
      </div>
    </div>
  );
}

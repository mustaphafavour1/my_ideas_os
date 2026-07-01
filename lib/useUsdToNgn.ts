'use client';

import { useEffect, useState } from 'react';
import { usdToNgn } from './fx';

const ngnFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

// Fetches the live USD->NGN rate once per mount (the server caches it for an
// hour, so repeat mounts just hit that warm cache). Returns a formatter that
// renders "…" until the rate resolves.
export function useUsdToNgn() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/fx/usd-ngn')
      .then((r) => r.json())
      .then((d) => { if (typeof d.rate === 'number') setRate(d.rate); })
      .catch(() => {});
  }, []);

  const formatNgn = (usd: number) => {
    if (!rate) return '…';
    return ngnFormatter.format(usdToNgn(usd, rate));
  };

  return { rate, formatNgn };
}

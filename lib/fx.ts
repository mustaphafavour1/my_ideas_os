// USD → NGN conversion for Paystack, whose merchant accounts are typically
// NGN-only unless multi-currency has been explicitly approved by Paystack.
// Falls back to a fixed rate if the live lookup fails, so checkout never
// breaks on an external API outage — update FALLBACK_USD_TO_NGN periodically.

const FALLBACK_USD_TO_NGN = 1600;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

let cached: { rate: number; at: number } | null = null;

export async function getUsdToNgnRate(): Promise<number> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rate;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    const rate = data?.rates?.NGN;
    if (typeof rate === 'number' && rate > 0) {
      cached = { rate, at: Date.now() };
      return rate;
    }
  } catch {
    // fall through to fallback
  }

  return FALLBACK_USD_TO_NGN;
}

// Rounds to the nearest 50 NGN for a cleaner customer-facing price.
export function usdToNgn(usd: number, rate: number): number {
  return Math.round((usd * rate) / 50) * 50;
}

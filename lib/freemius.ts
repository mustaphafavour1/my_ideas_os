import { Freemius } from '@freemius/sdk';

// Backend-only client — the SDK's own docs warn never to construct this in a
// browser/client context, since apiKey/secretKey are privileged credentials.
// "FREEMIUS_API_TOKEN" is what the Freemius Developer Dashboard calls it
// (Settings → API Token); the SDK's own field name for the same value is `apiKey`.
//
// Constructed lazily (not at module scope) because the SDK validates
// productId eagerly and throws on a missing/NaN value — Next.js evaluates
// route modules while collecting page data at build time, before real env
// vars are available in local/CI builds.
let _freemius: Freemius | null = null;

export function getFreemius(): Freemius {
  if (!_freemius) {
    _freemius = new Freemius({
      productId: Number(process.env.FREEMIUS_PRODUCT_ID),
      apiKey: process.env.FREEMIUS_API_TOKEN!,
      secretKey: process.env.FREEMIUS_SECRET_KEY!,
      publicKey: process.env.FREEMIUS_PUBLIC_KEY!,
    });
  }
  return _freemius;
}

// Freemius checkout has no custom-metadata passthrough, so our internal plan
// key ('one-time' | 'monthly') is recovered by mapping the Freemius plan ID
// on the webhook/redirect payload back through this same table.
export const FREEMIUS_PLAN_IDS: Record<string, string> = {
  'one-time': process.env.FREEMIUS_PLAN_ONE_TIME || '',
  'monthly': process.env.FREEMIUS_PLAN_MONTHLY || '',
};

export function planKeyFromFreemiusPlanId(freemiusPlanId: string | number | null | undefined): string | null {
  const id = String(freemiusPlanId ?? '');
  if (!id) return null;
  const match = Object.entries(FREEMIUS_PLAN_IDS).find(([, fsId]) => fsId && fsId === id);
  return match ? match[0] : null;
}

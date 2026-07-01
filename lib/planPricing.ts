// Single source of truth for USD list prices — used by the Paystack
// initiate route (server) and the checkout modals (client, for the NGN
// price preview) so the two never drift apart.
export const PLAN_AMOUNTS_USD: Record<string, number> = {
  'one-time': 3,
  'monthly':  10,
};

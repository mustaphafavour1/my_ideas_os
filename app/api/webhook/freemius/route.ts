import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { planUpdates, resolveUserIdByEmail, sendLoginLink } from '@/lib/grantPlan';
import { getFreemius, planKeyFromFreemiusPlanId } from '@/lib/freemius';

// This must be registered as a webhook endpoint in the Freemius Developer
// Dashboard. Signature verification (HMAC over the raw body, against
// FREEMIUS_SECRET_KEY) is handled internally by the SDK's listener.
export async function POST(req: NextRequest) {
  const freemius = getFreemius();
  const listener = freemius.webhook.createListener();

  listener.on('license.created', async ({ objects: { license, user } }) => {
    const licenseId = license.id;
    const plan = planKeyFromFreemiusPlanId(license.plan_id);
    const email = user?.email;
    if (!licenseId || !plan || !email) return;

    const supabase = createServiceClient();
    const reference = String(licenseId);

    // Deduplicate — Freemius can resend webhook events.
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('reference', reference)
      .maybeSingle();
    if (existing) return;

    const userId = await resolveUserIdByEmail(supabase, email);
    if (!userId) return;

    await supabase.from('users').update(planUpdates(plan)).eq('id', userId);

    // Purchase amount isn't in the license webhook payload — fetch it
    // separately for bookkeeping. Best-effort: the plan grant above already
    // succeeded regardless of whether this lookup or the insert below works.
    let amountCents = 0;
    let currency = 'USD';
    try {
      const purchase = await freemius.purchase.retrievePurchase(licenseId);
      if (purchase) {
        amountCents = Math.round((purchase.initialAmount || 0) * 100);
        currency = purchase.currency || 'USD';
      }
    } catch { /* non-fatal — bookkeeping only */ }

    try {
      await supabase.from('transactions').insert({
        user_id: userId,
        provider: 'freemius',
        amount_cents: amountCents,
        currency,
        plan,
        email,
        reference,
        status: 'succeeded',
      });
    } catch { /* non-fatal if transactions table doesn't exist yet */ }

    // Freemius checkout has no way to pass our own user_id through, so every
    // grant looks like a guest checkout from here — send the sign-in link
    // unconditionally. Already-logged-in upgraders get a harmless extra email.
    await sendLoginLink(supabase, email);
  });

  return freemius.webhook.processFetch(listener, req);
}

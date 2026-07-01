import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { planUpdates, resolveUserIdByEmail, sendLoginLink } from '@/lib/grantPlan';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

// Paystack callback: user lands here after completing payment on Paystack's hosted page.
// We re-verify the transaction server-side before granting access. The webhook is the
// authoritative grant path — this route mirrors it so the UX doesn't depend on the
// webhook having already fired by the time the browser redirects back.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  if (!reference) {
    return NextResponse.redirect(new URL('/#pricing?payment=failed', req.url));
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const data = await verifyRes.json();

  if (!data.status || data.data?.status !== 'success') {
    return NextResponse.redirect(new URL('/#pricing?payment=failed', req.url));
  }

  const txData = data.data;
  const metadata = txData.metadata || {};
  const plan = metadata.plan;
  const wasAuthedPurchase = Boolean(metadata.user_id);

  if (!plan) {
    return NextResponse.redirect(new URL('/app?payment=success', req.url));
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('reference', reference)
    .maybeSingle();

  if (!existing) {
    let userId: string | null = metadata.user_id || null;
    if (!userId) {
      const email = metadata.email || txData.customer?.email;
      if (email) userId = await resolveUserIdByEmail(supabase, email);
    }

    if (userId) {
      await supabase.from('users').update(planUpdates(plan)).eq('id', userId);

      try {
        await supabase.from('transactions').insert({
          user_id: userId,
          provider: 'paystack',
          amount_cents: txData.amount,
          currency: txData.currency,
          plan,
          email: txData.customer?.email || '',
          reference,
          status: 'succeeded',
        });
      } catch { /* non-fatal — webhook may have already recorded it */ }

      if (!wasAuthedPurchase && txData.customer?.email) {
        await sendLoginLink(supabase, txData.customer.email);
      }
    }
  }

  if (wasAuthedPurchase) {
    // Sign a short-lived HMAC token so we can show a toast on the redirect page
    const token = crypto.createHmac('sha256', PAYSTACK_SECRET).update(reference).digest('hex').slice(0, 16);
    return NextResponse.redirect(new URL(`/app?payment=success&ref=${token}`, req.url));
  }

  return NextResponse.redirect(new URL('/checkout/success', req.url));
}

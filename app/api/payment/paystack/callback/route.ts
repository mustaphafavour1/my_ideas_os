import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

const PLAN_BY_AMOUNT: Record<number, string> = {
  30000:  'one-time',
  100000: 'monthly',
};

// Paystack callback: user lands here after completing payment on Paystack's hosted page.
// We re-verify the transaction server-side before granting access.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  if (!reference) {
    return NextResponse.redirect(new URL('/pricing?payment=failed', req.url));
  }

  // Verify transaction with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });

  const data = await verifyRes.json();

  if (!data.status || data.data?.status !== 'success') {
    return NextResponse.redirect(new URL('/pricing?payment=failed', req.url));
  }

  const txData = data.data;
  const userId = txData.metadata?.user_id;
  const plan   = txData.metadata?.plan || PLAN_BY_AMOUNT[txData.amount];

  if (!userId || !plan) {
    return NextResponse.redirect(new URL('/app?payment=success', req.url));
  }

  const supabase = createServiceClient();

  const updates: Record<string, unknown> = { plan, plan_updated_at: new Date().toISOString() };
  if (plan === 'one-time') {
    updates.analysis_credits = 1;
    updates.max_conversations = 150;
  } else if (plan === 'monthly') {
    updates.monthly_syncs_remaining = 4;
    updates.subscription_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  await supabase.from('users').update(updates).eq('id', userId);

  // Deduplicate: only insert transaction if not already recorded by webhook
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('reference', reference)
    .maybeSingle();

  if (!existing) {
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
    } catch { /* non-fatal */ }
  }

  // Sign a short-lived HMAC token so we can show a toast on the redirect page
  const token = crypto.createHmac('sha256', PAYSTACK_SECRET).update(reference).digest('hex').slice(0, 16);

  return NextResponse.redirect(new URL(`/app?payment=success&ref=${token}`, req.url));
}

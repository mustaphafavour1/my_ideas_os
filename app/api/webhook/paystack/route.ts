import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

const PLAN_BY_AMOUNT: Record<number, string> = {
  30000:  'one-time', // $3 = 300 cents × 100
  100000: 'monthly',  // $10 = 1000 cents × 100
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature') || '';

  // Verify webhook signature
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const { amount, metadata, customer } = event.data;
  const userId = metadata?.user_id;
  const plan = metadata?.plan || PLAN_BY_AMOUNT[amount];

  if (!userId || !plan) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Grant access based on plan
  const updates: Record<string, unknown> = { plan, plan_updated_at: new Date().toISOString() };

  if (plan === 'one-time') {
    updates.analysis_credits = 1;
    updates.max_conversations = 150;
  } else if (plan === 'monthly') {
    updates.monthly_syncs_remaining = 4;
    updates.subscription_end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  await supabase.from('users').update(updates).eq('id', userId);

  // Record the transaction
  try {
    await supabase.from('transactions').insert({
      user_id: userId,
      provider: 'paystack',
      amount_cents: amount,
      currency: event.data.currency,
      plan,
      email: customer.email,
      reference: event.data.reference,
      status: 'succeeded',
    });
  } catch { /* non-fatal if transactions table doesn't exist yet */ }

  return NextResponse.json({ received: true });
}

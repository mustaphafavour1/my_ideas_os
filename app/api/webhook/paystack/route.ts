import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { planUpdates, resolveUserIdByEmail, sendLoginLink } from '@/lib/grantPlan';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

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

  const { amount, metadata, customer, reference, currency } = event.data;
  const plan = metadata?.plan;
  if (!plan) return NextResponse.json({ error: 'Missing plan metadata' }, { status: 400 });

  const supabase = createServiceClient();

  // Deduplicate: the browser callback route may have already processed this
  // reference (it fires independently of this webhook).
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('reference', reference)
    .maybeSingle();
  if (existing) return NextResponse.json({ received: true });

  let userId: string | null = metadata?.user_id || null;
  const isGuestCheckout = !userId;

  if (isGuestCheckout) {
    const email = metadata?.email || customer?.email;
    if (!email) return NextResponse.json({ error: 'Missing user_id or email metadata' }, { status: 400 });
    userId = await resolveUserIdByEmail(supabase, email);
  }
  if (!userId) return NextResponse.json({ error: 'Could not resolve user' }, { status: 500 });

  await supabase.from('users').update(planUpdates(plan)).eq('id', userId);

  try {
    await supabase.from('transactions').insert({
      user_id: userId,
      provider: 'paystack',
      amount_cents: amount,
      currency,
      plan,
      email: customer?.email || '',
      reference,
      status: 'succeeded',
    });
  } catch { /* non-fatal if transactions table doesn't exist yet */ }

  // Guest checkout: the user has no session yet — send them their sign-in link now.
  if (isGuestCheckout && customer?.email) {
    await sendLoginLink(supabase, customer.email);
  }

  return NextResponse.json({ received: true });
}

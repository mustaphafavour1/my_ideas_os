import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { planUpdates, resolveUserIdByEmail, sendLoginLink } from '@/lib/grantPlan';

const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-signature') || '';

  // Verify HMAC-SHA256 signature
  const hash = crypto.createHmac('sha256', LS_WEBHOOK_SECRET).update(body).digest('hex');
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  const eventName: string = event.meta?.event_name || '';

  if (!['order_created', 'subscription_created'].includes(eventName)) {
    return NextResponse.json({ received: true });
  }

  const attrs     = event.data?.attributes || {};
  const custom    = attrs.first_order_item?.custom_data || attrs.custom_data || event.meta?.custom_data || {};
  const plan      = custom.plan;
  const email     = attrs.user_email || custom.email;
  const reference = String(event.data?.id || '');

  if (!plan) return NextResponse.json({ error: 'Missing plan metadata' }, { status: 400 });

  const supabase = createServiceClient();

  // Deduplicate — Lemon Squeezy can resend webhook events.
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('reference', reference)
    .maybeSingle();
  if (existing) return NextResponse.json({ received: true });

  let userId: string | null = custom.user_id || null;
  const isGuestCheckout = !userId;

  if (isGuestCheckout) {
    if (!email) return NextResponse.json({ error: 'Missing user_id or email metadata' }, { status: 400 });
    userId = await resolveUserIdByEmail(supabase, email);
  }
  if (!userId) return NextResponse.json({ error: 'Could not resolve user' }, { status: 500 });

  await supabase.from('users').update(planUpdates(plan)).eq('id', userId);

  try {
    await supabase.from('transactions').insert({
      user_id: userId,
      provider: 'lemonsqueezy',
      amount_cents: attrs.total || 0,
      currency: attrs.currency || 'USD',
      plan,
      email: email || '',
      reference,
      status: 'succeeded',
    });
  } catch { /* non-fatal if transactions table doesn't exist yet */ }

  // Guest checkout: the user has no session yet — send them their sign-in link now.
  if (isGuestCheckout && email) {
    await sendLoginLink(supabase, email);
  }

  return NextResponse.json({ received: true });
}

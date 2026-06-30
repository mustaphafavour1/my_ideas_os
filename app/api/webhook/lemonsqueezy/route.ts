import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';

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

  const attrs   = event.data?.attributes || {};
  const custom  = attrs.first_order_item?.custom_data || attrs.custom_data || event.meta?.custom_data || {};
  const userId  = custom.user_id;
  const plan    = custom.plan;

  if (!userId || !plan) {
    return NextResponse.json({ error: 'Missing custom metadata' }, { status: 400 });
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

  try {
    await supabase.from('transactions').insert({
      user_id: userId,
      provider: 'lemonsqueezy',
      amount_cents: attrs.total || 0,
      currency: attrs.currency || 'USD',
      plan,
      email: attrs.user_email || '',
      reference: event.data?.id,
      status: 'succeeded',
    });
  } catch { /* non-fatal if transactions table doesn't exist yet */ }

  return NextResponse.json({ received: true });
}

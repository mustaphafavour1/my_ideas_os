import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();

  const [{ data: userRow }, { data: lastTx }] = await Promise.all([
    supabase.from('users').select('plan, plan_updated_at, subscription_end, analysis_credits').eq('id', user.id).single(),
    supabase.from('transactions').select('created_at, provider, plan, amount_cents, currency')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  return NextResponse.json({
    plan: userRow?.plan ?? null,
    plan_updated_at: userRow?.plan_updated_at ?? null,
    subscription_end: userRow?.subscription_end ?? null,
    analysis_credits: userRow?.analysis_credits ?? null,
    last_payment: lastTx ?? null,
  });
}

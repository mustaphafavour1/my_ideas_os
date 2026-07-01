import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { planUpdates, resolveUserIdByEmail, sendLoginLink } from '@/lib/grantPlan';
import { getUserFromRequest } from '@/lib/auth';

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
  const email = metadata.email || txData.customer?.email;

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
    if (!userId && email) userId = await resolveUserIdByEmail(supabase, email);

    if (userId) {
      await supabase.from('users').update(planUpdates(plan)).eq('id', userId);

      try {
        await supabase.from('transactions').insert({
          user_id: userId,
          provider: 'paystack',
          amount_cents: txData.amount,
          currency: txData.currency,
          plan,
          email: email || '',
          reference,
          status: 'succeeded',
        });
      } catch { /* non-fatal — webhook may have already recorded it */ }
    }
  }

  // A third-party redirect (through Paystack's own domain) isn't guaranteed to
  // preserve the session cookie — don't assume it survived. Check the current
  // request directly, and fall back to emailing a fresh sign-in link if it didn't,
  // rather than bouncing an already-paid, already-logged-in user to a bare /login.
  const currentUser = await getUserFromRequest(req);
  if (currentUser) {
    const token = crypto.createHmac('sha256', PAYSTACK_SECRET).update(reference).digest('hex').slice(0, 16);
    return NextResponse.redirect(new URL(`/app?payment=success&ref=${token}`, req.url));
  }

  if (email) await sendLoginLink(supabase, email);
  return NextResponse.redirect(new URL('/checkout/success', req.url));
}

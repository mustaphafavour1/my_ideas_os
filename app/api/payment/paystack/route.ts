import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getUsdToNgnRate, usdToNgn } from '@/lib/fx';
import { PLAN_AMOUNTS_USD } from '@/lib/planPricing';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const { plan, email: guestEmail } = await req.json();

  const usdAmount = PLAN_AMOUNTS_USD[plan];
  if (!usdAmount) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  // Authenticated purchase (in-dashboard upgrade, or already-signed-in website visitor)
  // falls back to guest checkout by email (anonymous website visitor pays first, signs in after).
  const user = await getUserFromRequest(req);
  const email = user?.email || (typeof guestEmail === 'string' ? guestEmail.trim() : '');
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const metadata: Record<string, unknown> = { plan, usd_reference: usdAmount };
  if (user) metadata.user_id = user.id;
  else metadata.email = email;

  // Paystack merchant accounts are typically NGN-only — convert and charge in Naira.
  const rate = await getUsdToNgnRate();
  const ngnAmount = usdToNgn(usdAmount, rate);
  metadata.ngn_rate = rate;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: ngnAmount * 100, // Paystack uses kobo (smallest unit)
      currency: 'NGN',
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/paystack/callback`,
    }),
  });

  const data = await res.json();
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 500 });

  return NextResponse.json({ authorization_url: data.data.authorization_url });
}

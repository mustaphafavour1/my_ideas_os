import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

const PLAN_AMOUNTS: Record<string, number> = {
  'one-time': 300,   // $3 USD in US cents — Paystack charges in kobo (NGN) or cents (USD)
  'monthly':  1000,  // $10 USD
};

export async function POST(req: NextRequest) {
  const { plan, email: guestEmail, currency = 'USD' } = await req.json();

  const amount = PLAN_AMOUNTS[plan];
  if (!amount) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  // Authenticated purchase (in-dashboard upgrade, or already-signed-in website visitor)
  // falls back to guest checkout by email (anonymous website visitor pays first, signs in after).
  const user = await getUserFromRequest(req);
  const email = user?.email || (typeof guestEmail === 'string' ? guestEmail.trim() : '');
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const metadata: Record<string, unknown> = { plan };
  if (user) metadata.user_id = user.id;
  else metadata.email = email;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // Paystack uses smallest currency unit (kobo/cents × 100)
      currency,
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/paystack/callback`,
    }),
  });

  const data = await res.json();
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 500 });

  return NextResponse.json({ authorization_url: data.data.authorization_url });
}

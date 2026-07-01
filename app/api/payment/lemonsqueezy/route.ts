import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const LS_API_KEY  = process.env.LEMONSQUEEZY_API_KEY!;
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!;

// Fill these in from your Lemon Squeezy product dashboard
const VARIANT_IDS: Record<string, string> = {
  'one-time': process.env.LS_VARIANT_ONE_TIME || '',
  'monthly':  process.env.LS_VARIANT_MONTHLY  || '',
};

export async function POST(req: NextRequest) {
  const { plan, email: guestEmail } = await req.json();
  const variantId = VARIANT_IDS[plan];
  if (!variantId) return NextResponse.json({ error: 'Invalid plan or variant not configured' }, { status: 400 });

  // Authenticated purchase (in-dashboard upgrade, or already-signed-in website visitor)
  // falls back to guest checkout by email (anonymous website visitor pays first, signs in after).
  const user = await getUserFromRequest(req);
  const email = user?.email || (typeof guestEmail === 'string' ? guestEmail.trim() : '');
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const custom: Record<string, unknown> = { plan };
  if (user) custom.user_id = user.id;
  else custom.email = email;

  const redirectUrl = user
    ? `${process.env.NEXT_PUBLIC_APP_URL}/app?payment=success`
    : `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`;

  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LS_API_KEY}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: { email, custom },
          product_options: { redirect_url: redirectUrl },
        },
        relationships: {
          store:   { data: { type: 'stores',   id: LS_STORE_ID } },
          variant: { data: { type: 'variants', id: variantId   } },
        },
      },
    }),
  });

  const data = await res.json();
  const url = data?.data?.attributes?.url;
  if (!url) return NextResponse.json({ error: 'Failed to create checkout', details: data }, { status: 500 });

  return NextResponse.json({ url });
}

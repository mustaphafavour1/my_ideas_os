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
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = await req.json();
  const variantId = VARIANT_IDS[plan];
  if (!variantId) return NextResponse.json({ error: 'Invalid plan or variant not configured' }, { status: 400 });

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
          checkout_data: {
            email: user.email,
            custom: { user_id: user.id, plan },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?payment=success`,
          },
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

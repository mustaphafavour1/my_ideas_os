import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getFreemius, FREEMIUS_PLAN_IDS } from '@/lib/freemius';

export async function POST(req: NextRequest) {
  const { plan, email: guestEmail } = await req.json();
  const planId = FREEMIUS_PLAN_IDS[plan];
  if (!planId) return NextResponse.json({ error: 'Invalid plan or plan not configured' }, { status: 400 });

  // Authenticated purchase (in-dashboard upgrade, or already-signed-in website visitor)
  // falls back to guest checkout by email (anonymous website visitor pays first, signs in after).
  const user = await getUserFromRequest(req);
  const email = user?.email || (typeof guestEmail === 'string' ? guestEmail.trim() : '');
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  try {
    const checkout = await getFreemius().checkout.create({ user: { email }, planId });
    return NextResponse.json({ url: checkout.getLink() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create checkout', details: String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';
import { sendLoginLink } from '@/lib/grantPlan';

// Lemon Squeezy's webhook is the authoritative grant path (already fired, or
// about to) — this route only decides where to send the browser back to. A
// third-party redirect through LS's checkout domain isn't guaranteed to
// preserve the session cookie, so check the current request directly instead
// of assuming the user is still logged in just because they were at checkout.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  const currentUser = await getUserFromRequest(req);
  if (currentUser) {
    return NextResponse.redirect(new URL('/app?payment=success', req.url));
  }

  if (email) {
    const supabase = createServiceClient();
    await sendLoginLink(supabase, email);
  }
  return NextResponse.redirect(new URL('/checkout/success', req.url));
}

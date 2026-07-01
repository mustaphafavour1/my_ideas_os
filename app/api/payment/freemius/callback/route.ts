import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';
import { sendLoginLink } from '@/lib/grantPlan';
import { getFreemius } from '@/lib/freemius';

// Freemius's webhook is the authoritative grant path (already fired, or about
// to) — this route only decides where to send the browser back to. A
// third-party redirect through Freemius's checkout domain isn't guaranteed to
// preserve the session cookie, so check the current request directly instead
// of assuming the user is still logged in just because they were at checkout.
//
// This must be registered as the product's checkout redirect URL in the
// Freemius Developer Dashboard — Freemius appends signed query params to it,
// which `getRedirectProcessor` verifies against FREEMIUS_SECRET_KEY.
export async function GET(req: NextRequest) {
  const processor = getFreemius().checkout.request.getRedirectProcessor({
    proxyUrl: process.env.NEXT_PUBLIC_APP_URL,
    async callback(info) {
      const currentUser = await getUserFromRequest(req);
      if (currentUser) {
        return NextResponse.redirect(new URL('/app?payment=success', req.url));
      }

      if (info.email) {
        const supabase = createServiceClient();
        await sendLoginLink(supabase, info.email);
      }
      return NextResponse.redirect(new URL('/checkout/success', req.url));
    },
  });

  return processor.processAction(req);
}

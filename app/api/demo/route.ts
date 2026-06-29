import { NextRequest, NextResponse } from 'next/server';

// Legacy route — kept for backward compat with existing waitlist links.
// Now redirects to the standalone /demo page instead of setting a cookie.
export function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'end') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.redirect(new URL('/demo', req.url));
}

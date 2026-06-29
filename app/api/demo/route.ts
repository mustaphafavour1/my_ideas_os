import { NextRequest, NextResponse } from 'next/server';
import { DEMO_COOKIE } from '@/lib/demo-mode';

export function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'end') {
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.delete(DEMO_COOKIE);
    return res;
  }

  const res = NextResponse.redirect(new URL('/app', req.url));
  res.cookies.set(DEMO_COOKIE, '1', {
    maxAge: 60 * 60 * 4,
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });
  return res;
}

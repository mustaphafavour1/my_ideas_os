import { NextResponse } from 'next/server';
import { getUsdToNgnRate } from '@/lib/fx';

export async function GET() {
  const rate = await getUsdToNgnRate();
  return NextResponse.json({ rate });
}

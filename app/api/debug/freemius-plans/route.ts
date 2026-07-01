import { NextResponse } from 'next/server';
import { getFreemius } from '@/lib/freemius';

// Temporary diagnostic route — lists the real Plan IDs and their nested
// Pricing IDs straight from the Freemius API, since the two are easy to mix
// up in the dashboard. Delete this route once FREEMIUS_PLAN_ONE_TIME /
// FREEMIUS_PLAN_MONTHLY are confirmed correct.
export async function GET() {
  try {
    const { plans } = await getFreemius().pricing.retrieve();
    const summary = (plans || []).map((p) => ({
      plan_id: p.id,
      plan_title: p.title,
      plan_name: p.name,
      pricings: (p.pricing || []).map((pr) => ({
        pricing_id: pr.id,
        monthly_price: pr.monthly_price,
        annual_price: pr.annual_price,
        lifetime_price: pr.lifetime_price,
      })),
    }));
    return NextResponse.json({ plans: summary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

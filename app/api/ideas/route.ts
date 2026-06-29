import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from('ideas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const sector = searchParams.get('sector');
  const search = searchParams.get('search');
  const limit = searchParams.get('limit');

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('idea_type', type);
  if (sector) query = query.ilike('sector', `%${sector}%`);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (limit) query = query.limit(parseInt(limit, 10));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();

  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('ideas')
      .insert({ ...body, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

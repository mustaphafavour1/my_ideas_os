import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('signals')
    .select('*, ideas(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signals = (data || []).map((s: Record<string, unknown> & { ideas?: { title: string } | null }) => ({
    ...s,
    idea_title: s.ideas ? (s.ideas as { title: string }).title : null,
    ideas: undefined,
  }));

  return NextResponse.json(signals);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, content, signal_type, idea_id } = await req.json();
    if (!title || !content) return NextResponse.json({ error: 'title and content required' }, { status: 400 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('signals')
      .insert({ user_id: user.id, title, content, signal_type: signal_type || 'strategy', idea_id: idea_id || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, title, content, signal_type } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updates: Record<string, string> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (signal_type !== undefined) updates.signal_type = signal_type;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('signals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const supabase = createServiceClient();
  const { error } = await supabase.from('signals').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

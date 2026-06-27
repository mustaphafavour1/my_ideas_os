import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .eq('user_id', 'favour')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('ideas')
      .update(body)
      .eq('id', id)
      .eq('user_id', 'favour')
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', id)
    .eq('user_id', 'favour');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

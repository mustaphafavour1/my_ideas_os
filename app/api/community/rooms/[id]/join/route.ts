import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const supabase = createServiceClient();
  await supabase.from('chat_room_members').upsert({ room_id: id, user_id: user.id }, { onConflict: 'room_id,user_id' });
  return NextResponse.json({ joined: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const supabase = createServiceClient();
  await supabase.from('chat_room_members').delete().eq('room_id', id).eq('user_id', user.id);
  return NextResponse.json({ joined: false });
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, room_id, content, created_at, user_id, users:user_id(display_username, full_name, avatar_url)')
    .eq('room_id', id)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(messages || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { content } = await req.json().catch(() => ({}));

  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) return NextResponse.json({ error: 'Message is empty' }, { status: 400 });
  if (trimmed.length > 2000) return NextResponse.json({ error: 'Message is too long' }, { status: 400 });

  const supabase = createServiceClient();

  // Posting implicitly joins the room, so sending a message never requires a separate join step.
  await supabase.from('chat_room_members').upsert({ room_id: id, user_id: user.id }, { onConflict: 'room_id,user_id' });

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ room_id: id, user_id: user.id, content: trimmed })
    .select('id, room_id, content, created_at, user_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

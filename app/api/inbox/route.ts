import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { processInboxItems } from '@/lib/claude';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('inbox')
    .select('*')
    .eq('user_id', 'favour')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'process') {
      // Process all unprocessed inbox items
      const { data: items } = await supabase
        .from('inbox')
        .select('*')
        .eq('user_id', 'favour')
        .eq('processed', false);

      if (!items || items.length === 0) {
        return NextResponse.json({ processed: 0, ideas_created: 0 });
      }

      const texts = items.map((i: { raw_text: string }) => i.raw_text);
      const ideas = await processInboxItems(texts);

      // Insert ideas
      for (const idea of ideas) {
        await supabase.from('ideas').insert({
          ...idea,
          user_id: 'favour',
          status: idea.status || 'captured',
          source_type: 'import',
          next_steps: idea.next_steps || [],
          blockers: idea.blockers || [],
          tags: [],
        });
      }

      // Mark processed
      const ids = items.map((i: { id: string }) => i.id);
      await supabase
        .from('inbox')
        .update({ processed: true })
        .in('id', ids);

      return NextResponse.json({ processed: items.length, ideas_created: ideas.length });
    }

    // Default: add to inbox
    const { data, error } = await supabase
      .from('inbox')
      .insert({
        raw_text: body.raw_text,
        user_id: 'favour',
        source: body.source || 'manual',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

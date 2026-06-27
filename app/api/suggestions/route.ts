import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { refreshSuggestions } from '@/lib/claude';
import { Idea } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();
    const ideas: Pick<Idea, 'id' | 'title' | 'description' | 'status' | 'sector' | 'idea_type' | 'next_steps' | 'blockers'>[] = body.ideas;

    if (!ideas || ideas.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    const suggestions = await refreshSuggestions(ideas);

    for (const s of suggestions) {
      await supabase
        .from('ideas')
        .update({ ai_suggestions: s.suggestion })
        .eq('id', s.id)
        .eq('user_id', 'favour');
    }

    return NextResponse.json({ updated: suggestions.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { extractIdeasFromConversations } from '@/lib/claude';
import { parseConversationExport, batchConversations, fuzzyMatchTitle } from '@/lib/parser';
import { Idea } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json().catch(() => ({}));

    const rawJson: string | null = body.conversationJson || null;

    if (!rawJson) {
      return NextResponse.json(
        { error: 'No conversation data provided. Upload a conversations.json export file.' },
        { status: 400 }
      );
    }

    const conversations = parseConversationExport(rawJson);
    if (conversations.length === 0) {
      return NextResponse.json({ added: 0, updated: 0, skipped: 0, total: 0 });
    }

    const batches = batchConversations(conversations);
    let allExtracted: Partial<Idea>[] = [];

    for (const batch of batches) {
      const texts = batch.map(
        (c) => `=== Conversation: ${c.name} (${c.created_at}) ===\n${c.fullText}`
      );
      const extracted = await extractIdeasFromConversations(texts);
      allExtracted = allExtracted.concat(extracted);
    }

    // Load existing ideas for fuzzy matching
    const { data: existingIdeas } = await supabase
      .from('ideas')
      .select('id, title')
      .eq('user_id', 'favour');

    const existing = (existingIdeas || []) as Pick<Idea, 'id' | 'title'>[];

    let added = 0, updated = 0, skipped = 0;

    for (const idea of allExtracted) {
      if (!idea.title) { skipped++; continue; }

      const match = existing.find((e) => fuzzyMatchTitle(e.title, idea.title!));

      const payload = {
        user_id: 'favour',
        title: idea.title,
        description: idea.description || null,
        sector: idea.sector || null,
        idea_type: idea.idea_type || null,
        status: idea.status || 'captured',
        grade_novelty: idea.grade_novelty || null,
        grade_feasibility: idea.grade_feasibility || null,
        grade_personal_fit: idea.grade_personal_fit || null,
        grade_market_potential: idea.grade_market_potential || null,
        grade_urgency: idea.grade_urgency || null,
        next_steps: idea.next_steps || [],
        blockers: idea.blockers || [],
        ai_suggestions: idea.ai_suggestions || null,
        ai_next_steps: idea.ai_next_steps || [],
        source_type: 'claude_chat' as const,
        source_ref: idea.source_ref || null,
        raw_source: null,
        tags: [],
        chat_date: idea.chat_date || null,
      };

      if (match) {
        await supabase.from('ideas').update(payload).eq('id', match.id);
        updated++;
      } else {
        await supabase.from('ideas').insert(payload);
        added++;
        existing.push({ id: 'new', title: idea.title });
      }
    }

    await supabase.from('sync_log').insert({
      user_id: 'favour',
      source: 'claude_export',
      ideas_found: allExtracted.length,
      ideas_added: added,
      ideas_updated: updated,
      notes: `Processed ${conversations.length} conversations in ${batches.length} batch(es)`,
    });

    return NextResponse.json({ added, updated, skipped, total: allExtracted.length });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Sync failed' },
      { status: 500 }
    );
  }
}

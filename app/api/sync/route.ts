import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { extractIdeasFromConversations } from '@/lib/claude';
import { ParsedConversation, parseConversationExport, batchConversations, fuzzyMatchTitle } from '@/lib/parser';
import { Idea } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json().catch(() => ({}));

    const rawJson: string | null = body.conversationJson || null;
    const conversationBatch: ParsedConversation[] | null = body.conversationBatch || null;

    if (!rawJson && !conversationBatch) {
      return NextResponse.json(
        { error: 'No conversation data provided. Upload a conversations.json export file.' },
        { status: 400 }
      );
    }

    let conversations: ParsedConversation[];

    if (conversationBatch) {
      conversations = conversationBatch;
    } else {
      conversations = parseConversationExport(rawJson!);
    }

    if (conversations.length === 0) {
      return NextResponse.json({
        added: 0, updated: 0, skipped: 0, total: 0,
        already_synced: 0,
        message: 'No conversations found in this file. Make sure you are uploading a valid Claude export JSON.',
      });
    }

    // --- Incremental sync: skip conversations we've already processed ---
    const { data: syncedRows } = await supabase
      .from('synced_conversations')
      .select('conversation_uuid')
      .eq('user_id', 'favour');

    const alreadySyncedUuids = new Set(
      (syncedRows || []).map((r: { conversation_uuid: string }) => r.conversation_uuid)
    );

    const newConversations = conversations.filter((c) => !alreadySyncedUuids.has(c.uuid));
    const alreadySyncedCount = conversations.length - newConversations.length;

    if (newConversations.length === 0) {
      return NextResponse.json({
        added: 0, updated: 0, skipped: 0, total: 0,
        already_synced: alreadySyncedCount,
        message: `All ${alreadySyncedCount} conversation(s) in this batch were already synced previously.`,
      });
    }

    // When receiving a pre-parsed batch from the client, treat it as one batch.
    // When receiving raw JSON, use the standard batching logic.
    const batches = conversationBatch
      ? [newConversations]
      : batchConversations(newConversations);

    let allExtracted: Partial<Idea>[] = [];

    for (const batch of batches) {
      const texts = batch.map(
        (c) => `=== Conversation: ${c.name} (${c.created_at}) ===\n${c.fullText}`
      );
      const extracted = await extractIdeasFromConversations(texts);
      allExtracted = allExtracted.concat(extracted);
    }

    // Load existing ideas for fuzzy duplicate matching
    const { data: existingIdeas } = await supabase
      .from('ideas')
      .select('id, title')
      .eq('user_id', 'favour');

    const existing = (existingIdeas || []) as Pick<Idea, 'id' | 'title'>[];

    let added = 0, updated = 0, skipped = 0;

    for (const idea of allExtracted) {
      if (!idea.title?.trim()) { skipped++; continue; }

      const match = existing.find((e) => fuzzyMatchTitle(e.title, idea.title!));

      const payload = {
        user_id: 'favour',
        title: idea.title.trim(),
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
        const { error } = await supabase.from('ideas').update(payload).eq('id', match.id);
        if (!error) updated++;
        else { console.error('Update error:', error); skipped++; }
      } else {
        const { error } = await supabase.from('ideas').insert(payload);
        if (!error) {
          added++;
          existing.push({ id: 'new', title: idea.title });
        } else { console.error('Insert error:', error); skipped++; }
      }
    }

    // Mark these conversations as synced so we skip them next time
    if (newConversations.length > 0) {
      const upsertRows = newConversations.map((c) => ({
        conversation_uuid: c.uuid,
        user_id: 'favour',
        ideas_extracted: allExtracted.length > 0
          ? Math.round(allExtracted.length / newConversations.length)
          : 0,
      }));

      await supabase
        .from('synced_conversations')
        .upsert(upsertRows, { onConflict: 'conversation_uuid,user_id' });
    }

    // Record sync log entry
    await supabase.from('sync_log').insert({
      user_id: 'favour',
      source: 'claude_export',
      ideas_found: allExtracted.length,
      ideas_added: added,
      ideas_updated: updated,
      notes: `${newConversations.length} new conversation(s), ${alreadySyncedCount} skipped (already synced). ${batches.length} batch(es) sent to Claude.`,
    });

    return NextResponse.json({
      added,
      updated,
      skipped,
      total: allExtracted.length,
      already_synced: alreadySyncedCount,
      conversations_processed: newConversations.length,
    });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Sync failed' },
      { status: 500 }
    );
  }
}

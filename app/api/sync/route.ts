import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { extractIdeasFromConversations } from '@/lib/claude';
import { ParsedConversation, parseConversationExport, batchConversations, fuzzyMatchTitle, extractConversationStats } from '@/lib/parser';
import { Idea } from '@/lib/types';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const PAID_PLANS = new Set(['one-time', 'monthly', 'enterprise']);

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createServiceClient();
    const body = await req.json().catch(() => ({}));

    const rawJson: string | null = body.conversationJson || null;
    const conversationBatch: ParsedConversation[] | null = body.conversationBatch || null;
    const userApiKey: string | null = body.apiKey || null;
    // Client-computed total batch count for this file (each conversationBatch
    // request is one batch of a larger file) — used to decide whether this
    // sync run is "bulk" and should use the cheaper model. Falls back to the
    // server-computed batch count for the raw-JSON single-shot path.
    const clientTotalBatches: number | null = typeof body.totalBatches === 'number' ? body.totalBatches : null;

    // --- Access check ---
    // Try to fetch the user's plan. Table may not exist yet (first deploy), so catch errors.
    let userPlan: string | null = null;
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('plan, analysis_credits, subscription_end')
        .eq('id', user.id)
        .single();
      userPlan = userRow?.plan ?? null;

      if (PAID_PLANS.has(userPlan ?? '')) {
        // Validate one-time credits / subscription expiry
        if (userPlan === 'one-time' && (userRow?.analysis_credits ?? 0) < 1) {
          return NextResponse.json(
            { error: 'payment_required', message: 'Your one-time analysis credit has been used. Upgrade for more.' },
            { status: 402 }
          );
        }
        if (userPlan === 'monthly' && userRow?.subscription_end && new Date(userRow.subscription_end) < new Date()) {
          return NextResponse.json(
            { error: 'payment_required', message: 'Your monthly subscription has expired. Renew to continue.' },
            { status: 402 }
          );
        }
      } else if (!userApiKey) {
        return NextResponse.json(
          { error: 'payment_required', message: 'Enter your Claude API key or upgrade to a paid plan to run analysis.' },
          { status: 402 }
        );
      }
    } catch {
      // users table may not exist yet — allow if apiKey provided
      if (!userApiKey) {
        return NextResponse.json(
          { error: 'payment_required', message: 'Enter your Claude API key or upgrade to a paid plan to run analysis.' },
          { status: 402 }
        );
      }
    }

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
      .eq('user_id', user.id);

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

    // Large bulk syncs (many batches for one file) switch to a cheaper model
    // and a tighter per-conversation content cap to keep costs down.
    const BULK_BATCH_THRESHOLD = 3;
    const totalBatchesForFile = clientTotalBatches ?? batches.length;
    const lowCost = totalBatchesForFile > BULK_BATCH_THRESHOLD;

    let allExtracted: Partial<Idea>[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const batch of batches) {
      const texts = batch.map(
        (c) => `=== Conversation: ${c.name} (${c.created_at}) ===\n${c.fullText}`
      );
      const { ideas: extracted, usage } = await extractIdeasFromConversations(texts, userApiKey, lowCost);
      allExtracted = allExtracted.concat(extracted);
      totalInputTokens += usage.input_tokens;
      totalOutputTokens += usage.output_tokens;
    }

    // Sonnet 4.6 pricing: $3/M input, $15/M output. Haiku 4.5: $1/M in, $5/M out.
    const estimatedCostUsd = lowCost
      ? (totalInputTokens * 1 + totalOutputTokens * 5) / 1_000_000
      : (totalInputTokens * 3 + totalOutputTokens * 15) / 1_000_000;

    // Load existing ideas for fuzzy duplicate matching
    const { data: existingIdeas } = await supabase
      .from('ideas')
      .select('id, title, updated_at')
      .eq('user_id', user.id);

    const existing = (existingIdeas || []) as Pick<Idea, 'id' | 'title' | 'updated_at'>[];

    let added = 0, updated = 0, skipped = 0;
    // Track inserted idea titles -> DB ids for parent resolution
    const insertedTitleToId = new Map<string, string>();

    for (const idea of allExtracted) {
      if (!idea.title?.trim()) { skipped++; continue; }

      const match = existing.find((e) => fuzzyMatchTitle(e.title, idea.title!));

      // "Last updated" should reflect when the idea was actually last discussed
      // (chat_date), not when the row happened to be synced into the DB.
      const chatDateMs = idea.chat_date ? Date.parse(idea.chat_date) : NaN;
      const chatUpdatedAt = Number.isNaN(chatDateMs) ? null : new Date(chatDateMs).toISOString();

      const payload = {
        user_id: user.id,
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
        user_complaints: (idea as unknown as { user_complaints?: string[] }).user_complaints || [],
        rephrasing_suggestions: (idea as unknown as { rephrasing_suggestions?: string[] }).rephrasing_suggestions || [],
      };

      if (match) {
        // Bump updated_at only if this conversation's chat_date is more recent
        // than what's already on the idea — otherwise keep the existing value.
        const nextUpdatedAt = chatUpdatedAt && chatUpdatedAt > match.updated_at ? chatUpdatedAt : match.updated_at;
        const { error } = await supabase.from('ideas').update({ ...payload, updated_at: nextUpdatedAt }).eq('id', match.id);
        if (!error) {
          updated++;
          insertedTitleToId.set(idea.title!.trim().toLowerCase(), match.id);
        } else { console.error('Update error:', error); skipped++; }
      } else {
        const insertUpdatedAt = chatUpdatedAt || new Date().toISOString();
        const { data: inserted, error } = await supabase.from('ideas').insert({ ...payload, updated_at: insertUpdatedAt }).select('id').single();
        if (!error && inserted) {
          added++;
          insertedTitleToId.set(idea.title!.trim().toLowerCase(), inserted.id);
          existing.push({ id: inserted.id, title: idea.title!, updated_at: insertUpdatedAt });
        } else { console.error('Insert error:', error); skipped++; }
      }
    }

    // Second pass: resolve parent_idea_id from related_to field
    for (const idea of allExtracted) {
      const relatedTo = (idea as unknown as { related_to?: string | null }).related_to;
      if (!relatedTo || !idea.title?.trim()) continue;
      const childId = insertedTitleToId.get(idea.title.trim().toLowerCase());
      if (!childId) continue;
      // Find the parent by fuzzy title match across all known ideas
      const parentEntry = existing.find((e) => fuzzyMatchTitle(e.title, relatedTo));
      if (parentEntry && parentEntry.id !== 'new' && parentEntry.id !== childId) {
        await supabase.from('ideas').update({ parent_idea_id: parentEntry.id }).eq('id', childId);
      }
    }

    // Mark these conversations as synced so we skip them next time
    if (newConversations.length > 0) {
      const upsertRows = newConversations.map((c) => ({
        conversation_uuid: c.uuid,
        user_id: user.id,
        ideas_extracted: allExtracted.length > 0
          ? Math.round(allExtracted.length / newConversations.length)
          : 0,
      }));

      await supabase
        .from('synced_conversations')
        .upsert(upsertRows, { onConflict: 'conversation_uuid,user_id' });
    }

    // Extract and store conversation stats (best-effort; won't break sync if tables missing)
    try {
      const conversationLogRows = newConversations.map((conv) => {
        const stats = extractConversationStats(conv.fullText);
        return {
          conversation_uuid: conv.uuid,
          user_id: user.id,
          title: conv.name,
          created_at: conv.created_at,
          source: conv.source,
          human_messages: stats.human_messages,
          assistant_messages: stats.assistant_messages,
          total_words: stats.total_words,
          human_words: stats.human_words,
          assistant_words: stats.assistant_words,
          code_blocks: stats.code_blocks,
          code_lines: stats.code_lines,
        };
      });

      await supabase
        .from('conversations_log')
        .upsert(conversationLogRows, { onConflict: 'user_id,conversation_uuid' });

      const totalsNew = conversationLogRows.reduce(
        (acc, r) => {
          acc.assistant_words_by_source[r.source] = (acc.assistant_words_by_source[r.source] || 0) + r.assistant_words;
          return {
            total_conversations: acc.total_conversations + 1,
            total_words: acc.total_words + r.total_words,
            total_human_words: acc.total_human_words + r.human_words,
            total_assistant_words: acc.total_assistant_words + r.assistant_words,
            total_code_blocks: acc.total_code_blocks + r.code_blocks,
            total_code_lines: acc.total_code_lines + r.code_lines,
            assistant_words_by_source: acc.assistant_words_by_source,
          };
        },
        { total_conversations: 0, total_words: 0, total_human_words: 0, total_assistant_words: 0, total_code_blocks: 0, total_code_lines: 0, assistant_words_by_source: {} as Record<string, number> }
      );

      const { data: existingStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const sortedDates = newConversations.map((c) => c.created_at).sort();
      const earliest = sortedDates[0];
      const latest = sortedDates[sortedDates.length - 1];

      const mergedBySource: Record<string, number> = { ...(existingStats?.assistant_words_by_source || {}) };
      for (const [src, words] of Object.entries(totalsNew.assistant_words_by_source)) {
        mergedBySource[src] = (mergedBySource[src] || 0) + words;
      }

      await supabase.from('user_stats').upsert({
        user_id: user.id,
        total_conversations: (existingStats?.total_conversations || 0) + totalsNew.total_conversations,
        total_words: (existingStats?.total_words || 0) + totalsNew.total_words,
        total_human_words: (existingStats?.total_human_words || 0) + totalsNew.total_human_words,
        total_assistant_words: (existingStats?.total_assistant_words || 0) + totalsNew.total_assistant_words,
        total_code_blocks: (existingStats?.total_code_blocks || 0) + totalsNew.total_code_blocks,
        total_code_lines: (existingStats?.total_code_lines || 0) + totalsNew.total_code_lines,
        assistant_words_by_source: mergedBySource,
        first_conversation_at: existingStats?.first_conversation_at
          ? (earliest < existingStats.first_conversation_at ? earliest : existingStats.first_conversation_at)
          : earliest,
        last_conversation_at: existingStats?.last_conversation_at
          ? (latest > existingStats.last_conversation_at ? latest : existingStats.last_conversation_at)
          : latest,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (statsErr) {
      console.warn('Conversation stats update failed (non-fatal):', statsErr);
    }

    // Record sync log entry
    await supabase.from('sync_log').insert({
      user_id: user.id,
      source: 'claude_export',
      ideas_found: allExtracted.length,
      ideas_added: added,
      ideas_updated: updated,
      notes: `${newConversations.length} new conversation(s), ${alreadySyncedCount} skipped (already synced). ${batches.length} batch(es) sent to Claude. Tokens: ${totalInputTokens} in / ${totalOutputTokens} out. Est. cost: $${estimatedCostUsd.toFixed(4)}. Key: ${userApiKey ? 'user-owned' : 'server'}.`,
    });

    // Decrement one-time analysis credit
    if (userPlan === 'one-time') {
      try {
        await supabase.rpc('decrement_analysis_credit', { uid: user.id });
      } catch { /* non-fatal */ }
    }

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

import Anthropic from '@anthropic-ai/sdk';
import { Idea } from './types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const EXTRACTION_SYSTEM_PROMPT = `You are an idea extraction engine. You will receive raw Claude conversation transcripts. Your job is to identify any distinct ideas, projects, explorations, or concepts the user was working on or thinking through.

For each idea found, return a JSON array. Each item must have:
- title: string (derive from context if not stated)
- description: string (2-4 sentences summarising the idea)
- sector: string (fintech, health-tech, design, community, personal, education, etc.)
- idea_type: one of [product, side_quest, portfolio, content, strategy, research, personal_development, automation, community, framework, experiment, partnership]
- status: one of [captured, lightly_researched, prototyping, validated, in_progress, paused, completed, archived]
- grade_novelty: 1-5
- grade_feasibility: 1-5
- grade_personal_fit: 1-5
- grade_market_potential: 1-5
- grade_urgency: 1-5
- next_steps: string[] (max 5, empty array if none obvious)
- blockers: string[] (empty array if none)
- ai_suggestions: string (one concrete recommendation for this idea)
- source_ref: string (conversation name or date)
- chat_date: ISO date string

If no clear ideas are present, return an empty array [].
Return only valid JSON array, no markdown, no explanation.`;

// Cap each conversation at ~1 250 tokens to keep costs low.
// Idea-relevant content is almost always in the first few exchanges.
const MAX_CONV_CHARS = 5000;

export async function extractIdeasFromConversations(
  conversationTexts: string[]
): Promise<Partial<Idea>[]> {
  const client = getClient();
  const truncated = conversationTexts.map((t) =>
    t.length > MAX_CONV_CHARS ? t.slice(0, MAX_CONV_CHARS) + '\n[…truncated]' : t
  );
  const batched = truncated.join('\n\n---NEXT CONVERSATION---\n\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: batched }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';

  // Check if output was truncated (stop_reason === 'max_tokens')
  if (message.stop_reason === 'max_tokens') {
    console.warn('Claude output hit max_tokens limit — JSON may be truncated');
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Try to salvage a partial array
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    // Try to parse as many complete objects as possible
    const objects = [...raw.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)];
    if (objects.length > 0) {
      try { return JSON.parse(`[${objects.map(m => m[0]).join(',')}]`); } catch { /* fall through */ }
    }
    console.error('Failed to parse Claude response as JSON. Raw:', raw.slice(0, 500));
    return [];
  }
}

const SUGGESTIONS_SYSTEM_PROMPT = `You are an idea coach for a product builder and creative thinker.
Given a list of active ideas with their details, provide ONE sharp, actionable recommendation for each idea.
Return a JSON array where each item has: { "id": string, "suggestion": string }
The suggestion should be 1-2 sentences max, concrete and specific. No generic advice.
Return only valid JSON array, no markdown.`;

export async function refreshSuggestions(
  ideas: Pick<Idea, 'id' | 'title' | 'description' | 'status' | 'sector' | 'idea_type' | 'next_steps' | 'blockers'>[]
): Promise<{ id: string; suggestion: string }[]> {
  const client = getClient();
  const prompt = ideas
    .map(
      (i) =>
        `ID: ${i.id}\nTitle: ${i.title}\nDescription: ${i.description || 'N/A'}\nStatus: ${i.status}\nSector: ${i.sector || 'N/A'}\nType: ${i.idea_type || 'N/A'}\nNext steps: ${i.next_steps?.join(', ') || 'None'}\nBlockers: ${i.blockers?.join(', ') || 'None'}`
    )
    .join('\n\n---\n\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: SUGGESTIONS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  }
}

const INBOX_SYSTEM_PROMPT = `You are an idea classifier. Given raw unstructured text that may contain one or more ideas,
classify each distinct idea into a structured format.

Return a JSON array. Each item must have:
- title: string
- description: string (2-3 sentences)
- sector: string
- idea_type: one of [product, side_quest, portfolio, content, strategy, research, personal_development, automation, community, framework, experiment, partnership]
- status: "captured"
- grade_novelty: 1-5
- grade_feasibility: 1-5
- grade_personal_fit: 1-5
- grade_market_potential: 1-5
- grade_urgency: 1-5
- next_steps: string[] (max 3)
- blockers: string[]
- ai_suggestions: string

Return only valid JSON array, no markdown.`;

export async function processInboxItems(items: string[]): Promise<Partial<Idea>[]> {
  const client = getClient();
  const prompt = items.map((item, i) => `Item ${i + 1}: ${item}`).join('\n\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: INBOX_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { Idea } from './types';

function getClient(apiKey?: string | null) {
  return new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
}

const EXTRACTION_SYSTEM_PROMPT = `You are an idea extraction engine. You will receive raw Claude conversation transcripts. Your job is to identify any distinct ideas, projects, explorations, or concepts the user was working on or thinking through.

For each idea found, return a JSON array. Each item must have:
- title: string (derive from context if not stated)
- description: string (2-4 sentences summarising the idea)
- sector: string (fintech, health-tech, design, community, personal, education, etc.)
- idea_type: one of [product, side_quest, portfolio, content, strategy, research, personal_development, automation, community, framework, experiment, partnership]
- status: one of [captured, lightly_researched, prototyping, validated, in_progress, paused, completed, archived]
  IMPORTANT for status: if the conversation mentions the idea is "shipped", "live", "deployed", "launched", "in production", "already built", "went live", or "done and working", set status to "completed". If it mentions actively building/coding right now, use "in_progress".
- grade_novelty: 1-5
- grade_feasibility: 1-5
- grade_personal_fit: 1-5
- grade_market_potential: 1-5
- grade_urgency: 1-5
- next_steps: string[] (max 5, empty array if none obvious)
- blockers: string[] (empty array if none)
- ai_suggestions: string (one concrete recommendation for this idea)
- source_ref: string (conversation name or date)
- chat_date: ISO date string (YYYY-MM-DD) — this MUST be the date shown in that
  conversation's own "=== Conversation: ... (DATE) ===" header, copied exactly.
  Never use today's date or the date you are doing this analysis on.
- related_to: string | null (if this idea is a sub-feature, variant, or closely related to another idea extracted from the SAME batch, put the EXACT title of that parent/related idea here; otherwise null)
- user_complaints: string[] (max 3 — frustrations or complaints the user expressed about AI responses in this conversation, e.g. "Claude kept ignoring the constraint about X"; empty array if none)
- rephrasing_suggestions: string[] (max 3 — cases where the user had to rephrase or retry a prompt; empty array if none)

If no clear ideas are present, return an empty array [].
Return only valid JSON array, no markdown, no explanation.`;

// Cap each conversation at ~1 250 tokens to keep costs low.
// Idea-relevant content is almost always in the first few exchanges.
const MAX_CONV_CHARS = 5000;
// Tighter cap for bulk syncs (many batches in one run) — same reasoning, just
// more aggressive since the per-batch cost adds up fast across many batches.
const MAX_CONV_CHARS_BULK = 3000;

const STANDARD_MODEL = 'claude-sonnet-4-6';
// Cheaper, faster model used automatically for large bulk syncs — see the
// `lowCost` param below.
const BULK_MODEL = 'claude-haiku-4-5-20251001';

export interface ExtractionResult {
  ideas: Partial<Idea>[];
  usage: { input_tokens: number; output_tokens: number };
}

export async function extractIdeasFromConversations(
  conversationTexts: string[],
  apiKey?: string | null,
  lowCost = false
): Promise<ExtractionResult> {
  const client = getClient(apiKey);
  const cap = lowCost ? MAX_CONV_CHARS_BULK : MAX_CONV_CHARS;
  const truncated = conversationTexts.map((t) =>
    t.length > cap ? t.slice(0, cap) + '\n[…truncated]' : t
  );
  const batched = truncated.join('\n\n---NEXT CONVERSATION---\n\n');

  const message = await client.messages.create({
    model: lowCost ? BULK_MODEL : STANDARD_MODEL,
    max_tokens: 8192,
    // Cached across batches within the same sync run (and across a session's
    // requests generally) — the system prompt is identical every call, so
    // repeat calls only pay the ~10% cache-read rate on it instead of full price.
    system: [{ type: 'text', text: EXTRACTION_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: batched }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';
  const usage = { input_tokens: message.usage.input_tokens, output_tokens: message.usage.output_tokens };

  if (message.stop_reason === 'max_tokens') {
    console.warn('Claude output hit max_tokens limit — JSON may be truncated');
  }

  let ideas: Partial<Idea>[];
  try {
    const parsed = JSON.parse(raw);
    ideas = Array.isArray(parsed) ? parsed : [];
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try { ideas = JSON.parse(match[0]); return { ideas, usage }; } catch { /* fall through */ }
    }
    const objects = [...raw.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)];
    if (objects.length > 0) {
      try { ideas = JSON.parse(`[${objects.map(m => m[0]).join(',')}]`); return { ideas, usage }; } catch { /* fall through */ }
    }
    console.error('Failed to parse Claude response as JSON. Raw:', raw.slice(0, 500));
    ideas = [];
  }
  return { ideas, usage };
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

export interface GeneralInsightsSummary {
  totalIdeas: number;
  monthsExperience: number;
  totalConversations: number;
  totalWords: number;
  totalCodeLines: number;
  assistantWordsBySource: Record<string, number> | null;
  statusBreakdown: Record<string, number>;
  sectorBreakdown: { sector: string; count: number; avgGrade: number | null; completedCount: number }[];
  typeBreakdown: { idea_type: string; count: number; avgGrade: number | null; completedCount: number }[];
  avgGrades: {
    novelty: number | null;
    feasibility: number | null;
    personal_fit: number | null;
    market_potential: number | null;
    urgency: number | null;
    overall: number | null;
  };
}

const GENERAL_INSIGHTS_SYSTEM_PROMPT = `You are a sharp, no-fluff strategic analyst for a solo builder who tracks every idea and every AI-assisted conversation they have in one dashboard. You'll receive a JSON summary of their WHOLE portfolio — sector/type distribution, status breakdown, grades, experience level, and usage totals. You do not see individual ideas.

Write 3-5 general insights about their OVERALL patterns — never about a single idea. Each insight must:
- Be grounded in specific numbers from the JSON you were given. Never invent a stat you weren't given.
- Connect at least two dimensions (e.g. a category's idea count vs. its completion rate; experience level vs. average grades; a status pattern that cuts across categories).
- Read like a sharp, honest friend, not a generic productivity tip.
- Where it fits, end with one concrete, specific action — grounded in what's actually in the data, not boilerplate advice.

Style examples (match this voice — do not copy these verbatim):
- "You've put more ideas into 'content' than anything else (9 of 31), but none have reached validated or completed — worth asking whether that's the format or the follow-through."
- "At 4 months in with an average feasibility grade of 2.6, you're better served chasing ideas that need little to no capital to test than ones requiring upfront spend — like a domain name — before you've validated demand."

Rules:
- You were NOT given time-spent or money-spent data. Never claim "you spent X hours/dollars on Y" — use idea count / share of the portfolio as the attention signal instead, and phrase it that way (counts, not time or money).
- Skip any category with fewer than 2 ideas — not enough signal to say anything real.
- No generic advice that could apply to any builder ("stay consistent", "believe in yourself", "diversify your portfolio").
- Return ONLY a JSON array of strings, no markdown, no explanation. Each string is one complete, standalone insight (1-2 sentences).`;

export async function generateGeneralInsights(summary: GeneralInsightsSummary): Promise<string[]> {
  const client = getClient();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: GENERAL_INSIGHTS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(summary) }],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return [];
  }
}

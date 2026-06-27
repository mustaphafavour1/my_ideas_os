import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM = `You are an innovation consultant helping adapt ideas to new contexts and markets.
Given an idea and a target context/market/direction, provide a structured analysis.
Return ONLY a valid JSON object with these exact keys:
{
  "title": "reframed title for the new context",
  "concept": "how the core idea applies in this new context (2-3 sentences)",
  "adaptations": ["specific change or adaptation needed", ...],
  "opportunities": ["key opportunity in this new context", ...],
  "challenges": ["challenge or risk to watch out for", ...]
}
adaptations: 3-5 items. opportunities: 2-4 items. challenges: 2-3 items.
No markdown, no explanation outside the JSON.`;

export async function POST(req: NextRequest) {
  try {
    const { idea, context, prompt: userPrompt } = await req.json();

    if (!idea || !context) {
      return NextResponse.json({ error: 'idea and context are required' }, { status: 400 });
    }

    const client = getClient();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Idea: "${idea.title}"
Description: ${idea.description || 'N/A'}
Current sector: ${idea.sector || 'N/A'}
Current type: ${idea.idea_type || 'N/A'}

Target context/market/direction: ${context}${userPrompt ? `\nAdditional guidance: ${userPrompt}` : ''}`,
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}';
    try {
      const result = JSON.parse(raw);
      return NextResponse.json(result);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return NextResponse.json(JSON.parse(match[0]));
      return NextResponse.json({ error: 'Parse error' }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

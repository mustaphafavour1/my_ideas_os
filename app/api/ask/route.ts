import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message, idea_id } = await req.json();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    const supabase = createServiceClient();

    let systemContext = '';
    if (idea_id) {
      const { data: idea } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', idea_id)
        .eq('user_id', user.id)
        .single();

      if (idea) {
        systemContext = `You are an AI assistant for Idea OS helping the user think through a specific idea.

Idea details:
Title: ${idea.title}
Description: ${idea.description || 'N/A'}
Status: ${idea.status}
Sector: ${idea.sector || 'N/A'}
Type: ${idea.idea_type || 'N/A'}
Grade (overall): ${idea.grade_overall ?? 'N/A'}/5
Next steps: ${idea.next_steps?.join(', ') || 'None'}
Blockers: ${idea.blockers?.join(', ') || 'None'}
AI suggestion: ${idea.ai_suggestions || 'None'}

Answer questions about this idea concisely and helpfully. Be specific.`;
      }
    } else {
      const { data: ideas } = await supabase
        .from('ideas')
        .select('id, title, status, sector, idea_type, grade_overall, description')
        .eq('user_id', user.id)
        .limit(40);

      const ideasCtx = (ideas || [])
        .map(i => `- ${i.title} [${i.status}${i.sector ? `, ${i.sector}` : ''}${i.grade_overall ? `, grade ${i.grade_overall}` : ''}]: ${(i.description || '').slice(0, 80)}`)
        .join('\n');

      systemContext = `You are an AI assistant for Idea OS, a personal idea intelligence dashboard.
The user's ideas:
${ideasCtx || '(no ideas yet)'}

Help the user think about their ideas. Answer questions, suggest priorities, spot patterns, or generate new ideas based on their interests. Keep responses concise (2-4 paragraphs max). Be specific to their actual ideas.`;
    }

    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemContext,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ response: text });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

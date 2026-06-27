interface ClaudeMessageContent {
  type: string;
  text?: string;
}

interface ClaudeMessage {
  sender: string;
  text?: string | null;
  // Newer export format and design chats use a content array instead of text
  content?: ClaudeMessageContent[] | string | null;
  created_at?: string;
}

interface ClaudeConversation {
  uuid: string;
  name: string;
  created_at: string;
  chat_messages: ClaudeMessage[];
}

function extractMessageText(m: ClaudeMessage): string {
  if (m.text?.trim()) return m.text.trim();
  if (Array.isArray(m.content)) {
    return m.content
      .filter((c) => c.type === 'text' && c.text?.trim())
      .map((c) => c.text!)
      .join('\n')
      .trim();
  }
  if (typeof m.content === 'string' && m.content.trim()) return m.content.trim();
  return '';
}

export interface ParsedConversation {
  uuid: string;
  name: string;
  created_at: string;
  fullText: string;
}

export function parseConversationExport(raw: string): ParsedConversation[] {
  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON in conversation export');
  }

  let conversations: ClaudeConversation[] = [];

  if (Array.isArray(data)) {
    // Full export: array of conversations
    conversations = data as ClaudeConversation[];
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (obj.conversations && Array.isArray(obj.conversations)) {
      // Wrapped: { conversations: [...] }
      conversations = obj.conversations as ClaudeConversation[];
    } else if (obj.uuid && Array.isArray(obj.chat_messages)) {
      // Single conversation file (UUID-named files from the export ZIP)
      conversations = [data as ClaudeConversation];
    } else if (obj.chat_messages && !obj.uuid) {
      // Some exports omit uuid at top level
      conversations = [data as ClaudeConversation];
    }
  }

  return conversations
    .filter((conv) => conv && Array.isArray(conv.chat_messages) && conv.chat_messages.length > 0)
    .map((conv) => {
      const messages = conv.chat_messages || [];
      const fullText = messages
        .map((m) => {
          const text = extractMessageText(m);
          return text ? `[${m.sender}]: ${text}` : null;
        })
        .filter(Boolean)
        .join('\n\n') as string;

      return {
        uuid: conv.uuid || `unknown-${Date.now()}`,
        name: conv.name || 'Unnamed Conversation',
        created_at: conv.created_at || new Date().toISOString(),
        fullText,
      };
    })
    .filter((c) => c.fullText.trim().length > 50); // skip trivially short conversations
}

export function batchConversations(
  conversations: ParsedConversation[],
  maxTokensPerBatch = 80000
): ParsedConversation[][] {
  const batches: ParsedConversation[][] = [];
  let current: ParsedConversation[] = [];
  let currentSize = 0;

  for (const conv of conversations) {
    const approxTokens = Math.ceil(conv.fullText.length / 4);
    if (currentSize + approxTokens > maxTokensPerBatch && current.length > 0) {
      batches.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(conv);
    currentSize += approxTokens;
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

export function fuzzyMatchTitle(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  if (Math.abs(na.length - nb.length) > 10) return false;
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  const dist = levenshtein(longer, shorter);
  return dist / longer.length < 0.25;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

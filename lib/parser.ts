interface ClaudeMessage {
  sender: string;
  text: string;
  created_at?: string;
}

interface ClaudeConversation {
  uuid: string;
  name: string;
  created_at: string;
  chat_messages: ClaudeMessage[];
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

  const conversations: ClaudeConversation[] = Array.isArray(data)
    ? (data as ClaudeConversation[])
    : (data as { conversations: ClaudeConversation[] }).conversations || [];

  return conversations.map((conv) => {
    const messages = conv.chat_messages || [];
    const fullText = messages
      .map((m) => `[${m.sender}]: ${m.text}`)
      .join('\n\n');

    return {
      uuid: conv.uuid,
      name: conv.name || 'Unnamed Conversation',
      created_at: conv.created_at,
      fullText,
    };
  });
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

  // Simple Levenshtein for short strings
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

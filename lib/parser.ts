// ─── Old export format (conversations.json) ──────────────────────────────────

interface OldMessage {
  sender: string;
  text?: string | null;
  content?: Array<{ type: string; text?: string }> | string | null;
  created_at?: string;
}

interface OldConversation {
  uuid?: string;
  name?: string;
  created_at?: string;
  chat_messages: OldMessage[];
}

function extractOldMessageText(m: OldMessage): string {
  if (typeof m.text === 'string' && m.text.trim()) return m.text.trim();
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

function parseOldConversation(conv: OldConversation): ParsedConversation | null {
  if (!Array.isArray(conv.chat_messages) || conv.chat_messages.length === 0) return null;

  const fullText = conv.chat_messages
    .map((m) => {
      const text = extractOldMessageText(m);
      return text ? `[${m.sender}]: ${text}` : null;
    })
    .filter(Boolean)
    .join('\n\n') as string;

  if (fullText.trim().length <= 50) return null;

  return {
    uuid: conv.uuid || `unknown-${Date.now()}`,
    name: conv.name || 'Unnamed Conversation',
    created_at: conv.created_at || new Date().toISOString(),
    fullText,
    source: 'claude',
  };
}

// ─── New export format (Claude Projects / Design / Artifacts chats) ───────────

interface NewMessage {
  uuid?: string;
  role: string;
  content: {
    content?: string;
    attachments?: Array<{ content?: string; name?: string; type?: string }>;
    contentBlocks?: Array<{ type: string; text?: string }>;
  };
  created_at?: string;
}

interface NewConversation {
  uuid?: string;
  title?: string;
  name?: string;
  project?: { uuid?: string; name?: string };
  created_at?: string;
  messages: NewMessage[];
}

function extractNewMessageText(m: NewMessage): string {
  const parts: string[] = [];

  // Main message text
  if (typeof m.content?.content === 'string' && m.content.content.trim()) {
    parts.push(m.content.content.trim());
  }

  // Content blocks (assistant messages may have text blocks alongside tool calls)
  if (Array.isArray(m.content?.contentBlocks)) {
    for (const block of m.content.contentBlocks) {
      if (block.type === 'text' && block.text?.trim()) {
        parts.push(block.text.trim());
      }
    }
  }

  // Attachments — include text only if the main content field was empty
  if (parts.length === 0 && Array.isArray(m.content?.attachments)) {
    for (const att of m.content.attachments) {
      const attText = att.content || '';
      if (attText.trim()) {
        // Cap attachment length to avoid drowning the conversation in system prompts
        parts.push(attText.trim().slice(0, 3000));
      }
    }
  }

  return parts.join('\n\n');
}

function parseNewConversation(conv: NewConversation): ParsedConversation | null {
  if (!Array.isArray(conv.messages) || conv.messages.length === 0) return null;

  const fullText = conv.messages
    .map((m) => {
      const text = extractNewMessageText(m);
      return text ? `[${m.role}]: ${text}` : null;
    })
    .filter(Boolean)
    .join('\n\n') as string;

  if (fullText.trim().length <= 50) return null;

  const name =
    conv.title ||
    conv.name ||
    conv.project?.name ||
    'Unnamed Conversation';

  return {
    uuid: conv.uuid || `unknown-${Date.now()}`,
    name,
    created_at: conv.created_at || new Date().toISOString(),
    fullText,
    source: 'claude',
  };
}

// ─── ChatGPT export format (mapping tree) ──────────────────────────────────────

interface ChatGPTMessage {
  author?: { role?: string };
  content?: { parts?: unknown[] };
  create_time?: number | null;
}

interface ChatGPTNode {
  message?: ChatGPTMessage | null;
}

interface ChatGPTConversation {
  conversation_id?: string;
  id?: string;
  title?: string;
  create_time?: number;
  mapping: Record<string, ChatGPTNode>;
}

function extractChatGPTMessageText(m: ChatGPTMessage): string {
  const parts = m.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join('\n')
    .trim();
}

// ChatGPT exports conversations with generic placeholder titles ("Chat", "New
// chat") when auto-titling never ran. Fall back to a snippet of the first
// user message so nothing shows up as a bare, indistinguishable "Chat".
const GENERIC_CHATGPT_TITLES = new Set(['chat', 'new chat', 'new conversation', 'untitled', '']);

function deriveChatGPTTitle(
  rawTitle: string | undefined,
  nodes: (ChatGPTNode & { message: ChatGPTMessage })[]
): string {
  const trimmed = (rawTitle || '').trim();
  if (trimmed && !GENERIC_CHATGPT_TITLES.has(trimmed.toLowerCase())) return trimmed;

  const firstUserMsg = nodes.find((n) => n.message.author?.role === 'user');
  const snippet = firstUserMsg ? extractChatGPTMessageText(firstUserMsg.message).slice(0, 60).trim() : '';
  if (!snippet) return trimmed || 'Unnamed Conversation';

  const ellipsis = snippet.length >= 60 ? '…' : '';
  return `Chat (${snippet}${ellipsis})`;
}

function parseChatGPTConversation(conv: ChatGPTConversation): ParsedConversation | null {
  if (!conv.mapping || typeof conv.mapping !== 'object') return null;

  const nodes = Object.values(conv.mapping)
    .filter((n): n is ChatGPTNode & { message: ChatGPTMessage } =>
      !!n.message && n.message.author?.role !== 'system' && !!n.message.create_time
    )
    .sort((a, b) => (a.message.create_time ?? 0) - (b.message.create_time ?? 0));

  const fullText = nodes
    .map((n) => {
      const text = extractChatGPTMessageText(n.message);
      return text ? `[${n.message.author?.role || 'unknown'}]: ${text}` : null;
    })
    .filter(Boolean)
    .join('\n\n') as string;

  if (fullText.trim().length <= 50) return null;

  const created_at = conv.create_time
    ? new Date(conv.create_time * 1000).toISOString()
    : new Date().toISOString();

  return {
    uuid: conv.conversation_id || conv.id || `unknown-${Date.now()}`,
    name: deriveChatGPTTitle(conv.title, nodes),
    created_at,
    fullText,
    source: 'chatgpt',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type ConversationSource = 'claude' | 'chatgpt';

export interface ParsedConversation {
  uuid: string;
  name: string;
  created_at: string;
  fullText: string;
  source: ConversationSource;
}

function parseSingleItem(item: unknown): ParsedConversation | null {
  if (!item || typeof item !== 'object') return null;
  const obj = item as Record<string, unknown>;

  if (Array.isArray(obj.chat_messages)) {
    return parseOldConversation(obj as unknown as OldConversation);
  }
  if (Array.isArray(obj.messages)) {
    return parseNewConversation(obj as unknown as NewConversation);
  }
  if (obj.mapping && typeof obj.mapping === 'object') {
    return parseChatGPTConversation(obj as unknown as ChatGPTConversation);
  }
  return null;
}

export function parseConversationExport(raw: string): ParsedConversation[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON in conversation export');
  }

  const results: ParsedConversation[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      const parsed = parseSingleItem(item);
      if (parsed) results.push(parsed);
    }
    return results;
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Wrapped array: { conversations: [...] }
    if (Array.isArray(obj.conversations)) {
      for (const item of obj.conversations) {
        const parsed = parseSingleItem(item);
        if (parsed) results.push(parsed);
      }
      return results;
    }

    // Single conversation (old or new format)
    const single = parseSingleItem(data);
    if (single) results.push(single);
  }

  return results;
}

export function batchConversations(
  conversations: ParsedConversation[],
  maxTokensPerBatch = 12500
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

export interface ConversationStats {
  human_messages: number;
  assistant_messages: number;
  total_words: number;
  human_words: number;
  assistant_words: number;
  code_blocks: number;
  code_lines: number;
}

export function extractConversationStats(fullText: string): ConversationStats {
  const segments = fullText.split(/\n\n(?=\[)/);

  let human_messages = 0;
  let assistant_messages = 0;
  let human_words = 0;
  let assistant_words = 0;
  let code_blocks = 0;
  let code_lines = 0;

  for (const seg of segments) {
    const roleMatch = seg.match(/^\[([^\]]+)\]:\s*/);
    if (!roleMatch) continue;

    const role = roleMatch[1].toLowerCase();
    const text = seg.slice(roleMatch[0].length);

    const codePattern = /```[\s\S]*?```/g;
    let m: RegExpExecArray | null;
    while ((m = codePattern.exec(text)) !== null) {
      code_blocks++;
      code_lines += Math.max(0, m[0].split('\n').length - 2);
    }

    const stripped = text.replace(/```[\s\S]*?```/g, ' ');
    const words = stripped.trim() ? stripped.trim().split(/\s+/).length : 0;

    if (role === 'human' || role === 'user') {
      human_messages++;
      human_words += words;
    } else {
      assistant_messages++;
      assistant_words += words;
    }
  }

  return {
    human_messages,
    assistant_messages,
    total_words: human_words + assistant_words,
    human_words,
    assistant_words,
    code_blocks,
    code_lines,
  };
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

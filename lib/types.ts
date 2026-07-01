export type IdeaType =
  | 'product'
  | 'side_quest'
  | 'portfolio'
  | 'content'
  | 'strategy'
  | 'research'
  | 'personal_development'
  | 'automation'
  | 'community'
  | 'framework'
  | 'experiment'
  | 'partnership';

export type IdeaStatus =
  | 'captured'
  | 'lightly_researched'
  | 'prototyping'
  | 'validated'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'archived';

export type SourceType =
  | 'claude_chat'
  | 'claude_design'
  | 'manual'
  | 'google_drive'
  | 'import';

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  raw_source: string | null;
  source_type: SourceType | null;
  source_ref: string | null;
  sector: string | null;
  idea_type: IdeaType | null;
  status: IdeaStatus;
  grade_novelty: number | null;
  grade_feasibility: number | null;
  grade_personal_fit: number | null;
  grade_market_potential: number | null;
  grade_urgency: number | null;
  grade_overall: number | null;
  next_steps: string[];
  blockers: string[];
  ai_suggestions: string | null;
  ai_next_steps: string[];
  tags: string[];
  chat_date: string | null;
  created_at: string;
  updated_at: string;
  parent_idea_id: string | null;
  user_complaints: string[];
  rephrasing_suggestions: string[];
}

export interface SyncLog {
  id: string;
  user_id: string;
  synced_at: string;
  source: string | null;
  ideas_found: number;
  ideas_added: number;
  ideas_updated: number;
  notes: string | null;
}

export interface InboxItem {
  id: string;
  user_id: string;
  raw_text: string;
  source: string;
  processed: boolean;
  created_at: string;
}

export interface SyncResult {
  added: number;
  updated: number;
  skipped: number;
  total: number;
}

export interface DashboardStats {
  total: number;
  in_progress: number;
  completed: number;
  avg_grade: number;
}

export interface ConversationLog {
  id: string;
  user_id: string;
  conversation_uuid: string;
  title: string | null;
  created_at: string;
  processed_at: string;
  source: string;
  human_messages: number;
  assistant_messages: number;
  total_words: number;
  human_words: number;
  assistant_words: number;
  code_blocks: number;
  code_lines: number;
}

export interface UserStats {
  user_id: string;
  total_conversations: number;
  total_words: number;
  total_human_words: number;
  total_assistant_words: number;
  total_code_blocks: number;
  total_code_lines: number;
  // Per-agent breakdown of total_assistant_words, e.g. { claude: 12000, chatgpt: 4500 }
  assistant_words_by_source?: Record<string, number> | null;
  first_conversation_at: string | null;
  last_conversation_at: string | null;
  updated_at: string;
}

export type SignalType = 'strategy' | 'pattern' | 'principle' | 'risk' | 'opportunity' | 'lesson';

export interface Signal {
  id: string;
  user_id: string;
  idea_id: string | null;
  idea_title?: string | null;
  title: string;
  content: string;
  signal_type: SignalType;
  created_at: string;
}

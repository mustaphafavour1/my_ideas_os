-- conversations_log: one row per processed conversation
CREATE TABLE IF NOT EXISTS conversations_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  conversation_uuid text NOT NULL,
  title text,
  created_at timestamptz NOT NULL,
  processed_at timestamptz DEFAULT now(),
  human_messages int DEFAULT 0,
  assistant_messages int DEFAULT 0,
  total_words int DEFAULT 0,
  human_words int DEFAULT 0,
  assistant_words int DEFAULT 0,
  code_blocks int DEFAULT 0,
  code_lines int DEFAULT 0,
  UNIQUE(user_id, conversation_uuid)
);

-- user_stats: running totals per user
CREATE TABLE IF NOT EXISTS user_stats (
  user_id text PRIMARY KEY,
  total_conversations int DEFAULT 0,
  total_words int DEFAULT 0,
  total_human_words int DEFAULT 0,
  total_assistant_words int DEFAULT 0,
  total_code_blocks int DEFAULT 0,
  total_code_lines int DEFAULT 0,
  first_conversation_at timestamptz,
  last_conversation_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS conversations_log_user_id_idx ON conversations_log(user_id);
CREATE INDEX IF NOT EXISTS conversations_log_created_at_idx ON conversations_log(created_at DESC);

-- Track which AI platform each conversation came from (Claude, ChatGPT, and
-- future sources like Gemini), so the conversations dashboard can show a
-- correct per-agent breakdown instead of attributing every AI message to Claude.

ALTER TABLE conversations_log
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'claude';

-- jsonb (not a fixed column per source) so adding a new AI source later
-- needs no further migration, e.g. { "claude": 12000, "chatgpt": 4500 }
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS assistant_words_by_source jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill: everything synced before this migration was Claude-only.
UPDATE user_stats
SET assistant_words_by_source = jsonb_build_object('claude', total_assistant_words)
WHERE assistant_words_by_source = '{}'::jsonb AND total_assistant_words > 0;

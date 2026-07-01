-- Generated alongside general_insights (same call, same timestamp) — a
-- handful of questions to ask before starting the next idea, derived from
-- the same portfolio-wide patterns. Safe to re-run.
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS next_idea_questions jsonb;

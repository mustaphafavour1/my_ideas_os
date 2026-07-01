-- General insights: an AI-generated narrative synthesis across a user's whole
-- idea/conversation history (sector/type patterns, grades, experience level).
-- Cached here so it doesn't regenerate on every page load — refreshed on
-- demand from the Insights page. Safe to re-run.
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS general_insights jsonb,
  ADD COLUMN IF NOT EXISTS general_insights_generated_at timestamptz;

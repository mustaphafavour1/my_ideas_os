-- =============================================================
-- Ideas OS — Full Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / DO NOTHING guards
-- =============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ─── ENUM types ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE idea_type_enum AS ENUM (
    'product', 'side_quest', 'portfolio', 'content',
    'strategy', 'research', 'personal_development',
    'automation', 'community', 'framework', 'experiment', 'partnership'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE idea_status_enum AS ENUM (
    'captured', 'lightly_researched', 'prototyping', 'validated',
    'in_progress', 'paused', 'completed', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE source_type_enum AS ENUM (
    'claude_chat', 'claude_design', 'manual', 'google_drive', 'import'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE signal_type_enum AS ENUM (
    'strategy', 'pattern', 'principle', 'risk', 'opportunity', 'lesson'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── ideas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ideas (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               text        NOT NULL,
  title                 text        NOT NULL,
  description           text,
  raw_source            text,
  source_type           source_type_enum,
  source_ref            text,                         -- 'demo_mode' flags demo rows
  sector                text,
  idea_type             idea_type_enum,
  status                idea_status_enum NOT NULL DEFAULT 'captured',

  -- Grades (0–5 scale)
  grade_novelty         numeric(3,1),
  grade_feasibility     numeric(3,1),
  grade_personal_fit    numeric(3,1),
  grade_market_potential numeric(3,1),
  grade_urgency         numeric(3,1),
  grade_overall         numeric(3,1),

  -- Arrays
  next_steps            text[]      NOT NULL DEFAULT '{}',
  blockers              text[]      NOT NULL DEFAULT '{}',
  tags                  text[]      NOT NULL DEFAULT '{}',
  ai_next_steps         text[]      NOT NULL DEFAULT '{}',

  ai_suggestions        text,
  chat_date             timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ideas_user_id_idx      ON ideas(user_id);
CREATE INDEX IF NOT EXISTS ideas_status_idx       ON ideas(status);
CREATE INDEX IF NOT EXISTS ideas_idea_type_idx    ON ideas(idea_type);
CREATE INDEX IF NOT EXISTS ideas_created_at_idx   ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS ideas_source_ref_idx   ON ideas(source_ref);

-- auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS ideas_updated_at ON ideas;
CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ─── sync_log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_log (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       text        NOT NULL,
  synced_at     timestamptz NOT NULL DEFAULT now(),
  source        text,                                 -- e.g. 'claude_export'
  ideas_found   int         NOT NULL DEFAULT 0,
  ideas_added   int         NOT NULL DEFAULT 0,
  ideas_updated int         NOT NULL DEFAULT 0,
  notes         text
);

CREATE INDEX IF NOT EXISTS sync_log_user_id_idx  ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS sync_log_synced_at_idx ON sync_log(synced_at DESC);

-- ─── inbox ────────────────────────────────────────────────────
-- Raw text drops before processing into ideas
CREATE TABLE IF NOT EXISTS inbox (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     text        NOT NULL,
  raw_text    text        NOT NULL,
  source      text        NOT NULL DEFAULT 'manual',  -- 'claude_export', 'paste', etc.
  processed   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inbox_user_id_idx     ON inbox(user_id);
CREATE INDEX IF NOT EXISTS inbox_processed_idx   ON inbox(processed);
CREATE INDEX IF NOT EXISTS inbox_created_at_idx  ON inbox(created_at DESC);

-- ─── conversations_log ────────────────────────────────────────
-- One row per processed Claude conversation
CREATE TABLE IF NOT EXISTS conversations_log (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             text        NOT NULL,
  conversation_uuid   text        NOT NULL,
  title               text,
  created_at          timestamptz NOT NULL,
  processed_at        timestamptz NOT NULL DEFAULT now(),
  human_messages      int         NOT NULL DEFAULT 0,
  assistant_messages  int         NOT NULL DEFAULT 0,
  total_words         int         NOT NULL DEFAULT 0,
  human_words         int         NOT NULL DEFAULT 0,
  assistant_words     int         NOT NULL DEFAULT 0,
  code_blocks         int         NOT NULL DEFAULT 0,
  code_lines          int         NOT NULL DEFAULT 0,
  UNIQUE(user_id, conversation_uuid)
);

CREATE INDEX IF NOT EXISTS conversations_log_user_id_idx    ON conversations_log(user_id);
CREATE INDEX IF NOT EXISTS conversations_log_created_at_idx ON conversations_log(created_at DESC);

-- ─── user_stats ───────────────────────────────────────────────
-- Aggregated running totals; upserted on every sync
CREATE TABLE IF NOT EXISTS user_stats (
  user_id                 text        PRIMARY KEY,
  total_conversations     int         NOT NULL DEFAULT 0,
  total_words             int         NOT NULL DEFAULT 0,
  total_human_words       int         NOT NULL DEFAULT 0,
  total_assistant_words   int         NOT NULL DEFAULT 0,
  total_code_blocks       int         NOT NULL DEFAULT 0,
  total_code_lines        int         NOT NULL DEFAULT 0,
  first_conversation_at   timestamptz,
  last_conversation_at    timestamptz,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ─── signals ──────────────────────────────────────────────────
-- Strategic insights, patterns, and principles linked to ideas
CREATE TABLE IF NOT EXISTS signals (
  id          uuid              DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     text              NOT NULL,
  idea_id     uuid              REFERENCES ideas(id) ON DELETE SET NULL,
  title       text              NOT NULL,
  content     text              NOT NULL,
  signal_type signal_type_enum  NOT NULL DEFAULT 'strategy',
  created_at  timestamptz       NOT NULL DEFAULT now(),
  updated_at  timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signals_user_id_idx    ON signals(user_id);
CREATE INDEX IF NOT EXISTS signals_idea_id_idx    ON signals(idea_id);
CREATE INDEX IF NOT EXISTS signals_created_at_idx ON signals(created_at DESC);

DROP TRIGGER IF EXISTS signals_updated_at ON signals;
CREATE TRIGGER signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
-- The app currently uses a service role key so RLS is bypassed,
-- but enable and configure it here for future auth integration.

ALTER TABLE ideas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox            ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals           ENABLE ROW LEVEL SECURITY;

-- Service-role bypass policies (service key ignores RLS)
-- Add user-scoped policies when you wire up Supabase Auth:
--
--   CREATE POLICY "users see own ideas" ON ideas
--     FOR ALL USING (auth.uid()::text = user_id);
--
--   (repeat for each table)

-- ─── Seed: demo data guard ────────────────────────────────────
-- The app detects demo mode by checking for source_ref = 'demo_mode'
-- in the ideas table. No seed data is inserted here — the app
-- handles demo data in-process via lib/demo-data.ts.

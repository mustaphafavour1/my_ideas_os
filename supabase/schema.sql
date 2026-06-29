-- =============================================================
-- Ideas OS — Full Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / DO NOTHING guards
-- =============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- ─── profiles ─────────────────────────────────────────────────
-- One row per real user. user_id matches auth.uid() when auth is wired up.
-- Until then the app uses a fixed text id ('favour') — migrate to uuid later.
-- NOTE: The app currently hardcodes user_id = 'favour' (text), so all FK
--       tables below use TEXT for user_id for compatibility. Switch to UUID
--       when you add Supabase Auth.

-- ─── ideas ───────────────────────────────────────────────────
-- UNIQUE(user_id, title) is intentionally omitted — a user can legitimately
-- have two ideas with the same title. Deduplication is handled at sync time
-- via source_ref (the Claude conversation UUID).
CREATE TABLE IF NOT EXISTS ideas (
  id                      uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 text            NOT NULL,
  title                   text            NOT NULL,
  description             text,
  raw_source              text,
  source_type             source_type_enum,
  -- source_ref holds the origin conversation UUID or 'demo_mode' for demo rows.
  -- Uniqueness on (user_id, source_ref) prevents duplicate syncs.
  source_ref              text,
  sector                  text,
  idea_type               idea_type_enum,
  status                  idea_status_enum NOT NULL DEFAULT 'captured',

  -- Grades: 0–5 scale
  grade_novelty           numeric(3,1),
  grade_feasibility       numeric(3,1),
  grade_personal_fit      numeric(3,1),
  grade_market_potential  numeric(3,1),
  grade_urgency           numeric(3,1),
  grade_overall           numeric(3,1),

  next_steps              text[]          NOT NULL DEFAULT '{}',
  blockers                text[]          NOT NULL DEFAULT '{}',
  tags                    text[]          NOT NULL DEFAULT '{}',
  ai_next_steps           text[]          NOT NULL DEFAULT '{}',
  ai_suggestions          text,

  chat_date               timestamptz,
  created_at              timestamptz     NOT NULL DEFAULT now(),
  updated_at              timestamptz     NOT NULL DEFAULT now(),

  -- Prevent the same source conversation being imported twice per user.
  -- Exclude demo rows (source_ref = 'demo_mode') from this constraint.
  CONSTRAINT ideas_user_source_uniq UNIQUE NULLS NOT DISTINCT (user_id, source_ref)
);

CREATE INDEX IF NOT EXISTS ideas_user_id_idx     ON ideas(user_id);
CREATE INDEX IF NOT EXISTS ideas_status_idx      ON ideas(status);
CREATE INDEX IF NOT EXISTS ideas_type_idx        ON ideas(idea_type);
CREATE INDEX IF NOT EXISTS ideas_created_at_idx  ON ideas(created_at DESC);
-- Fast demo-mode detection
CREATE INDEX IF NOT EXISTS ideas_source_ref_idx  ON ideas(user_id, source_ref)
  WHERE source_ref = 'demo_mode';

-- auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS ideas_updated_at ON ideas;
CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ─── sync_log ─────────────────────────────────────────────────
-- One row per sync run — intentionally an append-only audit trail.
-- No deduplication needed here.
CREATE TABLE IF NOT EXISTS sync_log (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       text        NOT NULL,
  synced_at     timestamptz NOT NULL DEFAULT now(),
  source        text,
  ideas_found   int         NOT NULL DEFAULT 0,
  ideas_added   int         NOT NULL DEFAULT 0,
  ideas_updated int         NOT NULL DEFAULT 0,
  notes         text
);

CREATE INDEX IF NOT EXISTS sync_log_user_id_idx   ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS sync_log_synced_at_idx ON sync_log(synced_at DESC);

-- ─── inbox ────────────────────────────────────────────────────
-- Raw text drops queued for processing into ideas.
CREATE TABLE IF NOT EXISTS inbox (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     text        NOT NULL,
  raw_text    text        NOT NULL,
  source      text        NOT NULL DEFAULT 'manual',
  processed   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inbox_user_id_idx    ON inbox(user_id);
CREATE INDEX IF NOT EXISTS inbox_processed_idx  ON inbox(user_id, processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS inbox_created_at_idx ON inbox(created_at DESC);

-- ─── conversations_log ────────────────────────────────────────
-- One row per unique Claude conversation UUID per user.
-- UNIQUE(user_id, conversation_uuid) prevents duplicates on re-sync.
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

CREATE INDEX IF NOT EXISTS conv_log_user_id_idx    ON conversations_log(user_id);
CREATE INDEX IF NOT EXISTS conv_log_created_at_idx ON conversations_log(created_at DESC);

-- ─── user_stats ───────────────────────────────────────────────
-- Exactly ONE row per user — upserted (not inserted) on every sync.
-- Primary key on user_id enforces the single-row invariant.
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
-- No extra index needed — user_id IS the primary key.

-- ─── signals ──────────────────────────────────────────────────
-- Strategic signals/insights per user; optionally linked to an idea.
-- No deduplication constraint — duplicate titles are valid.
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
ALTER TABLE ideas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals           ENABLE ROW LEVEL SECURITY;

-- The app uses the service-role key so RLS is bypassed in all current routes.
-- When you add Supabase Auth, replace the service-role calls with the anon
-- client and add per-user policies like:
--
--   CREATE POLICY "user sees own ideas" ON ideas
--     FOR ALL USING (auth.uid()::text = user_id);
--
-- (repeat for each table)

-- ─── Demo data clean-up ───────────────────────────────────────
-- Demo ideas are written with source_ref = 'demo_mode' so they can be
-- detected and excluded from real stats. To purge them:
--
--   DELETE FROM ideas WHERE source_ref = 'demo_mode';

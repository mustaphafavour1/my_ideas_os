-- =============================================================
-- Idea OS — Payments & Auth schema
-- Run this in Supabase SQL Editor AFTER schema.sql
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
-- =============================================================


-- ─── users ────────────────────────────────────────────────────
-- One row per Supabase Auth user. Auto-created by trigger below.
create table if not exists public.users (
  id                       uuid        primary key references auth.users(id) on delete cascade,
  email                    text,
  full_name                text,
  avatar_url               text,
  -- plan values: 'demo' | 'free' | 'one-time' | 'monthly' | 'enterprise'
  plan                     text        not null default 'demo',
  plan_updated_at          timestamptz,
  -- one-time plan: grants 1 credit; decremented after each sync run
  analysis_credits         int         not null default 0,
  max_conversations        int         not null default 10,
  -- monthly plan: optional soft cap on syncs per billing cycle
  monthly_syncs_remaining  int         not null default 0,
  subscription_end         timestamptz,
  is_enterprise            boolean     not null default false,
  enterprise_org_id        text,
  created_at               timestamptz not null default now()
);

-- Auto-create a users row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Called by the sync route after a successful one-time analysis
create or replace function public.decrement_analysis_credit(uid uuid)
returns void
language sql security definer
set search_path = public
as $$
  update public.users
  set analysis_credits = greatest(analysis_credits - 1, 0)
  where id = uid;
$$;


-- ─── transactions ─────────────────────────────────────────────
-- Append-only payment audit log. Written by webhook routes using
-- the service-role key (bypasses RLS).
create table if not exists public.transactions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        references public.users(id) on delete set null,
  provider      text        not null,   -- 'paystack' | 'lemonsqueezy'
  amount_cents  int         not null,
  currency      text        not null default 'USD',
  plan          text        not null,
  email         text,
  reference     text        unique,     -- Paystack reference / LS order id
  status        text        not null default 'succeeded',
  created_at    timestamptz not null default now()
);

create index if not exists tx_user_id_idx on public.transactions(user_id);
create index if not exists tx_created_at_idx on public.transactions(created_at desc);


-- ─── synced_conversations ─────────────────────────────────────
-- Tracks which Claude conversation UUIDs have already been processed
-- so re-uploads are skipped efficiently.
create table if not exists public.synced_conversations (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.users(id) on delete cascade,
  conversation_uuid   text        not null,
  ideas_extracted     int         not null default 0,
  synced_at           timestamptz not null default now(),
  unique (user_id, conversation_uuid)
);

create index if not exists sc_user_id_idx on public.synced_conversations(user_id);


-- ─── enterprise columns on conversations_log ─────────────────
-- Shows who had each conversation (enterprise accounts only).
alter table public.conversations_log
  add column if not exists member_name  text,
  add column if not exists member_email text;


-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.users          enable row level security;
alter table public.transactions   enable row level security;
alter table public.synced_conversations enable row level security;

-- users: each user sees only their own row
drop policy if exists "users_own_row" on public.users;
create policy "users_own_row" on public.users
  for all using (auth.uid() = id);

-- transactions: read own only; writes come from service-role key in webhooks
drop policy if exists "tx_read_own" on public.transactions;
create policy "tx_read_own" on public.transactions
  for select using (auth.uid() = user_id);

-- synced_conversations: own rows only
drop policy if exists "sc_own_rows" on public.synced_conversations;
create policy "sc_own_rows" on public.synced_conversations
  for all using (auth.uid() = user_id);


-- =============================================================
-- Backfill: create a users row for any existing auth users
-- (only relevant if you already have sign-ups before running this)
-- =============================================================
insert into public.users (id, email)
select id, email
from auth.users
on conflict (id) do nothing;

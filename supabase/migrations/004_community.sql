-- ─── Community: chat rooms ──────────────────────────────────────
-- Add more rooms any time with a plain INSERT — no code change needed.
create table if not exists public.chat_rooms (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text,
  icon         text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.chat_room_members (
  room_id    uuid not null references public.chat_rooms(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.chat_rooms(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_room_created_idx on public.chat_messages(room_id, created_at desc);
create index if not exists chat_room_members_user_idx on public.chat_room_members(user_id);

-- ─── Leaderboard: opt-in username + visibility ──────────────────
alter table public.users add column if not exists display_username text unique;
alter table public.users add column if not exists show_on_leaderboard boolean not null default false;

-- ─── RLS ─────────────────────────────────────────────────────────
alter table public.chat_rooms enable row level security;
alter table public.chat_room_members enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "rooms_read_all" on public.chat_rooms;
create policy "rooms_read_all" on public.chat_rooms for select using (true);

drop policy if exists "members_read_all" on public.chat_room_members;
create policy "members_read_all" on public.chat_room_members for select using (true);
drop policy if exists "members_manage_own" on public.chat_room_members;
create policy "members_manage_own" on public.chat_room_members for all
  using (auth.uid()::text = user_id::text) with check (auth.uid()::text = user_id::text);

drop policy if exists "messages_read_all" on public.chat_messages;
create policy "messages_read_all" on public.chat_messages for select using (true);
drop policy if exists "messages_insert_own" on public.chat_messages;
create policy "messages_insert_own" on public.chat_messages for insert
  with check (auth.uid()::text = user_id::text);

-- ─── Starter rooms ───────────────────────────────────────────────
insert into public.chat_rooms (slug, name, description, icon, sort_order) values
  ('founders',  'AI+ Founders',         'Building AI-native products and startups',    '🚀', 1),
  ('content',   'AI+ Content Creators', 'Writers, creators, and marketers using AI',   '✍️', 2),
  ('devs',      'AI+ Devs',             'Engineers shipping with AI tools',            '💻', 3),
  ('designers', 'AI+ Designers',        'Product & visual designers working with AI',  '🎨', 4),
  ('learners',  'AI+ Learners',         'Students and career-changers learning AI',    '📚', 5)
on conflict (slug) do nothing;

-- ─── Realtime ────────────────────────────────────────────────────
-- Enables live message delivery for the chat room UI.
alter publication supabase_realtime add table public.chat_messages;

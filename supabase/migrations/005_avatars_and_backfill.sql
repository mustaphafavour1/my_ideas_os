-- Backfill: create the public.users row for any auth.users account that's
-- missing one (e.g. your own account, created before the handle_new_user
-- trigger was picking up every signup path reliably). Safe to re-run.
insert into public.users (id, email)
select id, email
from auth.users
where id not in (select id from public.users)
on conflict (id) do nothing;

-- Avatars storage bucket — public read, 500KB limit, owner-only write.
-- Upload path convention: avatars/{user_id}/{filename}
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', true, 512000)
on conflict (id) do update set file_size_limit = 512000, public = true;

drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatar_owner_write" on storage.objects;
create policy "avatar_owner_write" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatar_owner_update" on storage.objects;
create policy "avatar_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "avatar_owner_delete" on storage.objects;
create policy "avatar_owner_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

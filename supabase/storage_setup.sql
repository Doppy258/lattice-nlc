-- Creates the public Storage bucket for business logos + banners, with
-- permissive policies matching this demo's RLS-off posture (see fix_rls.sql).
-- Run once in the Supabase SQL editor.

insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do nothing;

-- Public read + open write/update for the demo (anon + authenticated).
drop policy if exists "business_images_read"   on storage.objects;
drop policy if exists "business_images_insert" on storage.objects;
drop policy if exists "business_images_update" on storage.objects;

create policy "business_images_read"
  on storage.objects for select
  using (bucket_id = 'business-images');

create policy "business_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'business-images');

create policy "business_images_update"
  on storage.objects for update
  using (bucket_id = 'business-images');

-- Adds logo + banner image URLs to businesses (Supabase Storage public URLs).
-- Safe to run multiple times.

alter table public.businesses add column if not exists image_url  text;
alter table public.businesses add column if not exists banner_url text;

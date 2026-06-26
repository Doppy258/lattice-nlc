-- Fix: real signed-up accounts can't create storefronts / claims / reviews.
--
-- The schema has foreign keys (e.g. businesses.owner_user_id -> public.users)
-- that only the SEEDED owners (owner_sam, owner_nina) satisfy. A real account
-- authenticates through Supabase Auth (auth.users) and has NO row in
-- public.users, so every write that references a user fails with
--   23503 ... violates foreign key constraint "businesses_owner_user_id_fkey".
--
-- The app stores identity in Auth metadata and never maintains public.users,
-- so these FKs are vestigial. With RLS already disabled for this demo
-- (see fix_rls.sql), drop every FK that points at public.users. Dynamic so it
-- catches businesses, claims, reviews, rankings, saved_* — whatever exists —
-- without hard-coding constraint names. Safe to run multiple times.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT con.conrelid::regclass AS tbl, con.conname AS name
    FROM pg_constraint con
    JOIN pg_class      ref ON ref.oid = con.confrelid
    JOIN pg_namespace  ns  ON ns.oid  = ref.relnamespace
    WHERE con.contype = 'f'
      AND ns.nspname  = 'public'
      AND ref.relname = 'users'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.name);
    RAISE NOTICE 'Dropped FK % on %', r.name, r.tbl;
  END LOOP;
END $$;

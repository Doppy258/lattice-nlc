-- Two-sided verified redemption ("Lattice Pass").
-- Adds per-offer redemption rules and per-pass token / backup code / approver,
-- and allows the new 'pending' claim status. Safe to run multiple times.

-- Offer redemption rules
alter table public.offers
  add column if not exists one_time_per_user boolean not null default true;
alter table public.offers
  add column if not exists redemption_window_minutes integer not null default 5;

-- Pass fields on claims
alter table public.claims add column if not exists token text;
alter table public.claims add column if not exists backup_code text;
alter table public.claims add column if not exists approved_by_business_user_id text;

-- Drop any CHECK constraint on claims (e.g. a status whitelist) before
-- changing legacy rows to the new 'pending' status.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.claims'::regclass and contype = 'c'
  loop
    execute format('alter table public.claims drop constraint %I', c.conname);
  end loop;
end $$;

-- Backfill new columns for any legacy rows so they remain valid passes.
update public.claims
  set token = coalesce(token, claim_code),
      backup_code = coalesce(backup_code, claim_code)
  where token is null or backup_code is null;

-- Migrate the legacy "active" status to the new "pending".
update public.claims set status = 'pending' where status = 'active';

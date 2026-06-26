# Lattice Supabase backend

Slice 1 of the backend: the six core tables (`profiles, businesses, offers, claims, reviews, requests`),
Row-Level Security on every table, four `SECURITY DEFINER` RPCs for the trust-sensitive operations,
an `auth → profiles` trigger, and seed data with two demo logins.

Design: `../docs/superpowers/specs/2026-06-25-supabase-backend-design.md`
Plan:   `../docs/superpowers/plans/2026-06-25-supabase-backend.md`

## Layout

- `migrations/0001_core_schema.sql` — extensions, enums, tables, indexes
- `migrations/0002_rls.sql` — `is_business_owner()`, `public_profiles` view, RLS policies
- `migrations/0003_profiles_trigger.sql` — auto-create a profile on signup
- `migrations/0004_rpc_claims.sql` — `create_claim`, `redeem_claim`
- `migrations/0005_rpc_requests_reviews.sql` — `submit_request`, `create_review`
- `seed.sql` — demo users + representative content (local only; for hosted see below)
- `tests/*.sql` — pgTAP tests (`supabase test db`, requires the local stack)

> **Re-runnable / non-destructive.** All migrations and `apply_all.sql` are idempotent: enums/tables/
> indexes use `if not exists`, policies are dropped-if-exists then recreated, functions/triggers/views
> are replaced, and the seed uses `on conflict do nothing`. Running them against a database that already
> has some (or all) of these objects keeps existing objects and data and only adds what's missing — it
> will **not** error with "relation already exists".

## Apply — Option A: hosted project (no Docker needed)

1. In the Supabase dashboard → **SQL Editor**, paste **`apply_all.sql`** (or run the five `migrations/*.sql` files **in order**, 0001 → 0005). Safe to re-run on an existing project.
2. Create the two demo users (don't insert into `auth.users` by hand on hosted):
   ```bash
   SUPABASE_URL=https://<ref>.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
   node scripts/seed-auth-users.mjs
   ```
3. In the SQL Editor, run **only the content half** of `seed.sql` (everything from the first
   `insert into public.businesses ...` onward — skip the `auth.users` / `auth.identities` inserts,
   since step 2 already created those users with matching fixed UUIDs).
4. Point the app at the project: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.

## Apply — Option B: local stack (needs Docker + Supabase CLI)

```bash
supabase init           # if supabase/config.toml does not exist yet (keeps these migrations)
supabase start          # boots local Postgres + Auth in Docker
supabase db reset       # applies all migrations + seed.sql (incl. demo users)
supabase test db        # runs the pgTAP suite
```
Then set `.env` from `supabase status` (local API URL + anon key) and `npm run dev`.

## Demo logins

- Customer: `demo.customer@lattice.test` / `Demo1234!`
- Business owner: `demo.owner@lattice.test` / `Demo1234!`

## Security model (why writes are safe)

`claims`, `reviews`, and `requests` have **no** client INSERT/UPDATE/DELETE grant — they can only be
written through the `SECURITY DEFINER` RPCs, which run the limit/ownership checks atomically and read
the caller via `auth.uid()`. The browser only ever holds the anon key; the service-role key is used
solely by `scripts/seed-auth-users.mjs`.

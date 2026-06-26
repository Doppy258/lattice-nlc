# Lattice backend — design spec

- **Date:** 2026-06-25
- **Status:** Approved (design); implementation plan pending
- **Topic:** Replace the client-only localStorage data layer with a real Supabase backend (Postgres + RLS + RPC), slice 1.

## 1. Context — current state

Lattice is a Vite + React 18 + TypeScript SPA. Today:

- **Auth is already real:** Supabase Auth (email/password, session persistence, a reCAPTCHA `captchaToken` passed to `signUp`). Project URL `nzasnhmpcyxsgwpdxwni.supabase.co`.
- **There is no data backend.** Every domain collection (`users, businesses, offers, requests, claims, reviews, rankings, savedBusinesses, savedOffers`) is held as one synchronous `AppData` blob in React state, loaded from **localStorage** (`src/services/storageService.ts`) and seeded from `src/data/seed*`. All services (`claimService`, `offerMatchingService`, `reviewService`, `requestValidationService`, …) are **pure functions over in-memory arrays**.
- **Consequences:** any user can fabricate the entire dataset from devtools; claim issuance/redemption is non-atomic (`current_claims` can overshoot `max_claims`); claim codes are weak (`Math.random` over `PING-1000..9999`); all rate-limits / review-gating / captcha enforcement are client-side and bypassable; no shared multi-user or multi-device state.

The original PRD scoped Lattice as an offline FBLA-competition demo ("no required backend"). This work intentionally supersedes that: the goal is a **real multi-user product**.

## 2. Goals & non-goals

**Goals (slice 1):**
- Durable, shared, multi-user persistence for the six core entities: `profiles, businesses, offers, claims, reviews, requests`.
- Server-enforced security: RLS on every table; trust-sensitive writes only through `SECURITY DEFINER` RPCs.
- Atomic claim issuance/redemption; server-authoritative review gating and business-rating recomputation.
- Client refactored to read/write the backend while preserving the existing component contract (`useApp().data.*`).

**Non-goals (deferred to slice 2+):**
- `saved_businesses`, `saved_offers`, `rankings` tables; server-side report/analytics aggregation.
- Moving OfferRank matching / personal-ranking algorithms server-side (they remain client-side recommendations; not a security boundary).
- Bot-protection hardening (Turnstile/reCAPTCHA verify) — slice 1.5.

## 3. Architecture

Keep the existing Supabase project. Add:

1. **Postgres schema** mirroring `src/models/`, snake_case columns, Postgres enums, RLS on every table.
2. **RPC functions** (`SECURITY DEFINER`) for atomic/authoritative operations: `create_claim`, `redeem_claim`, `submit_request`, `create_review`.
3. **A client data layer** (`src/repositories/`) that hydrates `AppData` from Supabase on load and routes mutations through table writes / RPCs, mirroring results into the existing context.

Edge Functions are reserved for operations needing an external secret/call (reCAPTCHA siteverify) — not the core data ops, since a single in-DB transaction is simpler and genuinely atomic.

The existing pure services stay as the **client-side preview/UX validation layer** (instant feedback); the RPCs are the authoritative mirror of the same rules.

## 4. Data model → SQL schema

Naming: DB is snake_case; the repository layer maps snake_case ↔ the existing camelCase TS models so `src/models/` is unchanged.

### Enums
```sql
create type user_role         as enum ('customer','businessOwner','admin');
create type business_category as enum ('food','retail','services','fitness','education','repair','entertainment');
create type offer_type        as enum ('discount','limitedTime','studentOffer','groupOffer','appointmentSlot','event','freeTrial','bundle');
create type claim_status      as enum ('active','redeemed','expired','cancelled');
create type request_status    as enum ('draft','submitted','matched','expired');
create type need_type         as enum (
  'lunch','cafeStudySpot','dessert','dinner','groupMeal','quickSnack',
  'gift','clothing','books','thrift','schoolSupplies','homeItem',
  'haircut','salonService','printing','alterations','tutoring','cleaning',
  'gymTrial','dropInClass','sportsFacility','personalTraining',
  'testPrep','workshop','studySpace',
  'phoneRepair','laptopRepair','bikeRepair','clothingRepair',
  'escapeRoom','arcade','movieActivity','localEvent','groupHangout');
```

### Tables (key columns)
- **`profiles`** — `id uuid pk references auth.users(id) on delete cascade`, `name text`, `email text`, `role user_role default 'customer'`, `home_location_id text default 'origin_school'`, `verified bool default false`, `preferences jsonb default '{"preferredCategories":[],"maxDefaultDistanceKm":3,"studentDiscountPreferred":false,"accessibilityNeeds":[],"savedBusinessIds":[],"savedOfferIds":[]}'`, `onboarding_complete bool default false`, `created_at timestamptz default now()`.
- **`businesses`** — `id uuid pk default gen_random_uuid()`, `name`, `category business_category`, `description`, `address`, `location jsonb` (`{lat,lng}`), `hours jsonb default '[]'`, `rating_average numeric(3,2) default 0`, `review_count int default 0`, `verified bool default false`, `price_level smallint check (1..4)`, `tags text[]`, `accessibility_features text[]`, `owner_user_id uuid references profiles(id) on delete cascade`, `created_at`.
- **`offers`** — `id uuid pk`, `business_id uuid references businesses(id) on delete cascade`, `title`, `description`, `category business_category`, `offer_type offer_type`, `price numeric(10,2)`, `original_price numeric(10,2)`, `valid_from timestamptz`, `valid_until timestamptz`, `max_claims int check (>0)`, `current_claims int default 0 check (>=0)`, `views int default 0`, `tags text[]`, `student_only bool`, `verification_required bool`, `active bool default true`, `created_at`.
- **`claims`** — `id uuid pk`, `user_id uuid references profiles(id)`, `offer_id uuid references offers(id)`, `business_id uuid references businesses(id)`, `claim_code text unique`, `status claim_status default 'active'`, `created_at`, `expires_at timestamptz`, `redeemed_at timestamptz`. Partial unique index `(user_id, offer_id) where status in ('active','redeemed')` to hard-block duplicate claims.
- **`reviews`** — `id uuid pk`, `user_id`, `business_id`, `offer_id`, `claim_id uuid unique references claims(id)` (one review per claim), `rating smallint check (1..5)`, `text text`, `tags text[]`, `verified bool default true`, `created_at`.
- **`requests`** — `id uuid pk`, `user_id`, `category business_category`, `need_type need_type`, `budget_min numeric`, `budget_max numeric`, `distance_km numeric`, `time_start timestamptz`, `time_end timestamptz`, `preferences text[]`, `optional_note text`, `verified_human bool default false`, `status request_status default 'submitted'`, `created_at`.

ID change: persisted rows use DB-generated `uuid`s; client `createId()` is dropped for these entities (inserts/RPCs return the row). `claim_code` keeps the `PING-####` prefix (matches current code; PRD's `Lattice-####` not adopted — flagged).

Indexes: FKs (`offers.business_id`, `claims.user_id/business_id/offer_id`, `reviews.business_id`, `requests.user_id`), `offers (active, valid_until)`, `claims (claim_code)`.

## 5. Security model — RLS

RLS enabled on all tables. The marketplace is behind login, so reads are granted `to authenticated` (not `anon`). Helper: `is_business_owner(biz uuid) returns bool` = `exists(select 1 from businesses where id = biz and owner_user_id = auth.uid())`.

- **`profiles`** — `select`/`update` only `id = auth.uid()`; no client `insert`/`delete` (trigger creates, cascade deletes). Because RLS is row- not column-level, reviewer/owner **display names** come from a separate `public_profiles` view exposing only `id, name, role, verified` (granted to authenticated) — so emails/preferences are never readable by other users.
- **`businesses`** — `select` to authenticated; `insert` with check `owner_user_id = auth.uid()`; `update`/`delete` using `owner_user_id = auth.uid()`.
- **`offers`** — `select` to authenticated; `insert`/`update`/`delete` only when `is_business_owner(business_id)`.
- **`claims`** — `select` when `user_id = auth.uid()` **or** `is_business_owner(business_id)`. **No client `insert`/`update`/`delete`** — created/changed only by `create_claim` / `redeem_claim`.
- **`reviews`** — `select` to authenticated; **no client `insert`** — only via `create_review`.
- **`requests`** — `select` when `user_id = auth.uid()`; **no client `insert`** — only via `submit_request` (keeps rate-limits server-side).

Because `claims`/`reviews`/`requests` have no direct write grant, the anon key cannot fabricate them — closing the "redeemed claim from devtools" hole.

## 6. Trust-sensitive operations — RPC (`SECURITY DEFINER`)

Constants mirror `src/utils/constants.ts`: `MAX_ACTIVE_CLAIMS=3`, `MAX_ACTIVE_REQUESTS=5`, `DUPLICATE_REQUEST_COOLDOWN_MIN=10`, `MAX_REQUEST_WINDOW_DAYS=7`, `REVIEW_TEXT_MIN/MAX=10/300`. Each raises typed errors (e.g. `OFFER_FULL`) the repository maps to the existing user-facing messages.

- **`create_claim(p_offer_id uuid) returns claims`** — `auth.uid()` required; `select … from offers where id=p_offer_id for update`; assert `active and valid_until >= now()` (`OFFER_EXPIRED`), `current_claims < max_claims` (`OFFER_FULL`), no existing active/redeemed claim for this user+offer (`ALREADY_CLAIMED`), active-claim count `< 3` (`TOO_MANY_ACTIVE`); generate a unique `PING-####`; insert claim (`expires_at = valid_until`); `current_claims := current_claims + 1`. All one transaction → no race.
- **`redeem_claim(p_code text) returns claims`** — find claim by code (`CODE_NOT_FOUND`); assert `is_business_owner(business_id)` (`NOT_YOUR_BUSINESS`), `status='active'` (`ALREADY_REDEEMED`/`NOT_ACTIVE`), `expires_at >= now()` (`EXPIRED`); set `status='redeemed', redeemed_at=now()`.
- **`submit_request(payload jsonb) returns requests`** — `auth.uid()` required; assert basic field presence + window ≤ 7 days; rate-limit: active requests `< 5` (`TOO_MANY_REQUESTS`), no same-(category,need_type) request within 10 min (`DUPLICATE_REQUEST`); insert with `status='submitted'`. (Heavy semantic validation stays client-side for UX; server enforces the abuse-relevant subset.)
- **`create_review(p_claim_id uuid, p_rating int, p_text text, p_tags text[]) returns reviews`** — load claim; assert `user_id = auth.uid()` and `status='redeemed'` (`NOT_REDEEMED`), no existing review for claim (`ALREADY_REVIEWED`, also enforced by unique), `rating 1..5`, `length(text) between 10 and 300`; insert review; recompute `businesses.rating_average`/`review_count` from `reviews` in the same transaction.

## 7. Auth, profiles & roles

- Trigger `handle_new_user` (`after insert on auth.users`) inserts a `profiles` row (`name` from `raw_user_meta_data.name` or email local-part; default role `customer`). Replaces `createLocalUser`/`findOrCreateLocalUser`.
- A user becomes `businessOwner` when they create a business (the create flow sets `owner_user_id` and the RPC/trigger bumps `role`). `admin` set manually in SQL.
- `activeUser` becomes the authenticated user's `profiles` row; `completeOnboarding` updates `profiles` (not localStorage).
- **Demo accounts (approved):** seed one customer and one business owner (known emails/passwords) via `auth.users` inserts in the seed, so seed businesses are genuinely owned and reviewers can sign in to real multi-user data.

## 8. Client refactor — "hydrate-then-mirror"

- **New `src/repositories/`** wraps Supabase: `profileRepo, businessRepo, offerRepo, claimRepo, reviewRepo, requestRepo`. Each maps snake_case rows ↔ camelCase models and exposes `listAll()` + mutation methods (`claimRepo.create(offerId)` → `rpc('create_claim')`, etc.). `profileRepo` returns the full **self** profile plus a display-only list from `public_profiles` (for reviewer/owner names); `data.users` is hydrated from that union.
- **`AppProvider`** (`src/app/providers.tsx`): on auth-ready, one batched hydrate populates `AppData` from the repos (replacing `loadData()`); pages keep reading `data.businesses/offers/claims/...` **unchanged**. A `refetch()`/per-entity reload is exposed for post-mutation sync.
- **Mutations become async** and authoritative-first: e.g. `useClaim.claim()` awaits `claimRepo.create(offer.id)`, then on success updates the local mirror via `setData` (append claim, bump `current_claims`, mark request matched) and toasts; on error toasts the mapped message and does not mutate. Same pattern for offer create/update, redeem, review, request submit.
- **Retire** `storageService` as the data source (localStorage no longer holds domain data; Supabase persists the session). `resetDemoData` is removed from the client (a shared DB can't be reset per-client; dev uses `supabase db reset`).
- Matching/ranking/reports keep running client-side over hydrated `AppData` in slice 1.

Files touched: `src/app/providers.tsx`, `src/components/domain/useClaim.ts`, `src/pages/*` mutation call-sites, `src/services/authService.ts` (profile via trigger), onboarding flow; new `src/repositories/*`; `storageService` reduced to session/active-id helpers or removed.

## 9. Bot protection (slice 1.5)

Supabase Auth natively verifies **hCaptcha/Turnstile, not Google reCAPTCHA**, so today's `captchaToken` isn't actually verified. Recommended: switch the signup widget to **Cloudflare Turnstile** (native Supabase verify) — small client change. Alternative: a `verify-recaptcha` Edge Function calling Google `siteverify`. Deferred unless pulled forward.

## 10. Seed & ops

- Add CLI-managed `supabase/`: `migrations/*.sql` (enums, tables, indexes, RLS, RPCs, trigger) and `seed.sql` (the `src/data/seed*` content converted to SQL with uuid PKs + FK wiring + demo accounts).
- The **user applies** it: `supabase link`, `supabase db push`, (later) `supabase functions deploy`. The **service-role key stays server-only**; the client keeps using the anon key. Exact commands provided in the plan.

## 11. Testing

- **DB:** pgTAP or scripted SQL — cross-user `select`/`write` denied by RLS; `create_claim` respects `max_claims` under concurrent calls and the per-user active cap; `redeem_claim` enforces ownership + status; `create_review` requires a redeemed claim and recomputes rating; trigger creates a profile on signup.
- **Client:** repository unit tests with a mocked Supabase client (row↔model mapping, error mapping); a manual verification checklist (sign in as demo customer → claim → sign in as demo owner → redeem → customer reviews → rating updates) against the running app.

## 12. Resolved decisions

- (a) Seed **demo auth accounts** — yes.
- (b) Keep **`PING-`** claim-code prefix — yes (matches current code).
- (c) Bot-protection (Turnstile/reCAPTCHA verify) — **deferred to slice 1.5**.

## 13. Risks

- Async read model is the largest change; mitigated by preserving the `useApp().data.*` contract via hydrate-then-mirror rather than a full React Query rewrite.
- Seeding `auth.users` directly is environment-sensitive; the plan will use Supabase-supported seeding (SQL insert into `auth.users` + `auth.identities`, or the admin API) and document it.
- RLS mistakes can silently over-expose; covered by the explicit RLS test matrix in §11.

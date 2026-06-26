-- Lattice backend — consolidated apply script (slice 1)
-- IDEMPOTENT / NON-DESTRUCTIVE: safe to run against an EXISTING Supabase project.
-- Existing tables/enums/policies/data are retained; only missing objects are added.
-- Generated from supabase/migrations/*.sql + supabase/seed.sql.

-- ============================================================
-- supabase/migrations/0001_core_schema.sql
-- ============================================================
-- Idempotent / non-destructive: safe to re-run against an existing database.
-- Existing objects are kept as-is; only missing ones are created.

-- Extensions
create extension if not exists pgcrypto;      -- gen_random_uuid(), crypt()

-- Enums (guarded so re-running does not error if the type already exists)
do $$ begin create type user_role         as enum ('customer','businessOwner','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type business_category as enum ('food','retail','services','fitness','education','repair','entertainment'); exception when duplicate_object then null; end $$;
do $$ begin create type offer_type        as enum ('discount','limitedTime','studentOffer','groupOffer','appointmentSlot','event','freeTrial','bundle'); exception when duplicate_object then null; end $$;
do $$ begin create type claim_status      as enum ('active','redeemed','expired','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type request_status    as enum ('draft','submitted','matched','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type need_type         as enum (
  'lunch','cafeStudySpot','dessert','dinner','groupMeal','quickSnack',
  'gift','clothing','books','thrift','schoolSupplies','homeItem',
  'haircut','salonService','printing','alterations','tutoring','cleaning',
  'gymTrial','dropInClass','sportsFacility','personalTraining',
  'testPrep','workshop','studySpace',
  'phoneRepair','laptopRepair','bikeRepair','clothingRepair',
  'escapeRoom','arcade','movieActivity','localEvent','groupHangout'); exception when duplicate_object then null; end $$;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                text not null default '',
  email               text not null default '',
  role                user_role not null default 'customer',
  home_location_id    text not null default 'origin_school',
  verified            boolean not null default false,
  preferences         jsonb not null default
    '{"preferredCategories":[],"maxDefaultDistanceKm":3,"studentDiscountPreferred":false,"accessibilityNeeds":[],"savedBusinessIds":[],"savedOfferIds":[]}'::jsonb,
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now()
);

create table if not exists public.businesses (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  category               business_category not null,
  description            text not null default '',
  address                text not null default '',
  location               jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  hours                  jsonb not null default '[]'::jsonb,
  rating_average         numeric(3,2) not null default 0,
  review_count           int not null default 0,
  verified               boolean not null default false,
  price_level            smallint not null default 1 check (price_level between 1 and 4),
  tags                   text[] not null default '{}',
  accessibility_features text[] not null default '{}',
  owner_user_id          uuid not null references public.profiles(id) on delete cascade,
  created_at             timestamptz not null default now()
);
create index if not exists businesses_owner_idx on public.businesses(owner_user_id);

create table if not exists public.offers (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references public.businesses(id) on delete cascade,
  title                 text not null,
  description           text not null default '',
  category              business_category not null,
  offer_type            offer_type not null,
  price                 numeric(10,2) not null,
  original_price        numeric(10,2),
  valid_from            timestamptz not null,
  valid_until           timestamptz not null,
  max_claims            int not null check (max_claims > 0),
  current_claims        int not null default 0 check (current_claims >= 0),
  views                 int not null default 0,
  tags                  text[] not null default '{}',
  student_only          boolean not null default false,
  verification_required boolean not null default false,
  active                boolean not null default true,
  created_at            timestamptz not null default now()
);
create index if not exists offers_business_idx on public.offers(business_id);
create index if not exists offers_active_idx on public.offers(active, valid_until);

create table if not exists public.claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  offer_id    uuid not null references public.offers(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  claim_code  text not null unique,
  status      claim_status not null default 'active',
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  redeemed_at timestamptz
);
create index if not exists claims_user_idx on public.claims(user_id);
create index if not exists claims_business_idx on public.claims(business_id);
-- a user may hold at most one active/redeemed claim per offer
create unique index if not exists claims_one_per_offer_idx
  on public.claims(user_id, offer_id)
  where status in ('active','redeemed');

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  offer_id    uuid not null references public.offers(id) on delete cascade,
  claim_id    uuid not null unique references public.claims(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  text        text not null,
  tags        text[] not null default '{}',
  verified    boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists reviews_business_idx on public.reviews(business_id);

create table if not exists public.requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  category       business_category not null,
  need_type      need_type not null,
  budget_min     numeric(10,2),
  budget_max     numeric(10,2),
  distance_km    numeric not null,
  time_start     timestamptz not null,
  time_end       timestamptz not null,
  preferences    text[] not null default '{}',
  optional_note  text,
  verified_human boolean not null default false,
  status         request_status not null default 'submitted',
  created_at     timestamptz not null default now()
);
create index if not exists requests_user_idx on public.requests(user_id);

-- ============================================================
-- supabase/migrations/0002_rls.sql
-- ============================================================
-- Idempotent / non-destructive: safe to re-run. Policies are dropped-if-exists
-- then recreated; the view is replaced; enabling RLS is a no-op if already on.

-- Ownership helper (SECURITY DEFINER so it can read businesses regardless of caller RLS)
create or replace function public.is_business_owner(biz uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.businesses where id = biz and owner_user_id = auth.uid()
  );
$$;

-- Display-only projection of profiles (no email/preferences)
drop view if exists public.public_profiles;
create view public.public_profiles as
  select id, name, role, verified from public.profiles;
grant select on public.public_profiles to authenticated;

-- Enable RLS (no error if already enabled)
alter table public.profiles   enable row level security;
alter table public.businesses enable row level security;
alter table public.offers     enable row level security;
alter table public.claims     enable row level security;
alter table public.reviews    enable row level security;
alter table public.requests   enable row level security;

-- profiles: self only
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- businesses: read all (authenticated); write own
drop policy if exists businesses_select on public.businesses;
create policy businesses_select on public.businesses
  for select to authenticated using (true);
drop policy if exists businesses_insert_own on public.businesses;
create policy businesses_insert_own on public.businesses
  for insert to authenticated with check (owner_user_id = auth.uid());
drop policy if exists businesses_update_own on public.businesses;
create policy businesses_update_own on public.businesses
  for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
drop policy if exists businesses_delete_own on public.businesses;
create policy businesses_delete_own on public.businesses
  for delete to authenticated using (owner_user_id = auth.uid());

-- offers: read all; write only via owning business
drop policy if exists offers_select on public.offers;
create policy offers_select on public.offers
  for select to authenticated using (true);
drop policy if exists offers_insert_owner on public.offers;
create policy offers_insert_owner on public.offers
  for insert to authenticated with check (public.is_business_owner(business_id));
drop policy if exists offers_update_owner on public.offers;
create policy offers_update_owner on public.offers
  for update to authenticated using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
drop policy if exists offers_delete_owner on public.offers;
create policy offers_delete_owner on public.offers
  for delete to authenticated using (public.is_business_owner(business_id));

-- claims: read own or as owning business; NO direct write (RPC only)
drop policy if exists claims_select on public.claims;
create policy claims_select on public.claims
  for select to authenticated using (user_id = auth.uid() or public.is_business_owner(business_id));

-- reviews: read all; NO direct write (RPC only)
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select to authenticated using (true);

-- requests: read own; NO direct write (RPC only)
drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests
  for select to authenticated using (user_id = auth.uid());

-- Grant base privileges (RLS still gates rows). No insert/update/delete grant
-- on claims/reviews/requests => only SECURITY DEFINER RPCs can write them.
grant select on public.profiles, public.businesses, public.offers, public.claims, public.reviews, public.requests to authenticated;
grant insert, update, delete on public.businesses, public.offers to authenticated;
grant update on public.profiles to authenticated;

-- ============================================================
-- supabase/migrations/0003_profiles_trigger.sql
-- ============================================================
-- Idempotent / non-destructive: function is replaced; trigger is dropped-if-exists
-- then recreated.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- supabase/migrations/0004_rpc_claims.sql
-- ============================================================
create or replace function public.create_claim(p_offer_id uuid)
returns public.claims
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.offers%rowtype;
  v_active_count int;
  v_code text;
  v_claim public.claims;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception 'OFFER_NOT_FOUND'; end if;
  if not v_offer.active or v_offer.valid_until < now() then raise exception 'OFFER_EXPIRED'; end if;
  if v_offer.current_claims >= v_offer.max_claims then raise exception 'OFFER_FULL'; end if;

  if exists (select 1 from public.claims
             where user_id = v_uid and offer_id = p_offer_id and status in ('active','redeemed')) then
    raise exception 'ALREADY_CLAIMED';
  end if;

  select count(*) into v_active_count from public.claims where user_id = v_uid and status = 'active';
  if v_active_count >= 3 then raise exception 'TOO_MANY_ACTIVE'; end if;

  loop
    v_code := 'PING-' || lpad((1000 + floor(random() * 9000))::int::text, 4, '0');
    exit when not exists (select 1 from public.claims where claim_code = v_code);
  end loop;

  insert into public.claims (user_id, offer_id, business_id, claim_code, status, expires_at)
  values (v_uid, p_offer_id, v_offer.business_id, v_code, 'active', v_offer.valid_until)
  returning * into v_claim;

  update public.offers set current_claims = current_claims + 1 where id = p_offer_id;
  return v_claim;
end;
$$;

create or replace function public.redeem_claim(p_code text)
returns public.claims
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_claim public.claims;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  select * into v_claim from public.claims where claim_code = upper(trim(p_code)) for update;
  if not found then raise exception 'CODE_NOT_FOUND'; end if;
  if not public.is_business_owner(v_claim.business_id) then raise exception 'NOT_YOUR_BUSINESS'; end if;
  if v_claim.status = 'redeemed' then raise exception 'ALREADY_REDEEMED'; end if;
  if v_claim.status = 'expired' or v_claim.expires_at < now() then raise exception 'EXPIRED'; end if;
  if v_claim.status <> 'active' then raise exception 'NOT_ACTIVE'; end if;

  update public.claims set status = 'redeemed', redeemed_at = now()
    where id = v_claim.id returning * into v_claim;
  return v_claim;
end;
$$;

revoke all on function public.create_claim(uuid) from public, anon;
revoke all on function public.redeem_claim(text) from public, anon;
grant execute on function public.create_claim(uuid) to authenticated;
grant execute on function public.redeem_claim(text) to authenticated;

-- ============================================================
-- supabase/migrations/0005_rpc_requests_reviews.sql
-- ============================================================
create or replace function public.submit_request(
  p_category business_category,
  p_need_type need_type,
  p_distance_km numeric,
  p_time_start timestamptz,
  p_time_end timestamptz,
  p_budget_min numeric default null,
  p_budget_max numeric default null,
  p_preferences text[] default '{}',
  p_optional_note text default null,
  p_verified_human boolean default false
) returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_active int;
  v_req public.requests;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_time_end <= p_time_start then raise exception 'BAD_TIME_WINDOW'; end if;
  if p_time_end < now() then raise exception 'TIME_IN_PAST'; end if;
  if p_time_end > p_time_start + interval '7 days' then raise exception 'WINDOW_TOO_LONG'; end if;

  select count(*) into v_active from public.requests
    where user_id = v_uid and status in ('submitted','matched');
  if v_active >= 5 then raise exception 'TOO_MANY_REQUESTS'; end if;

  if exists (select 1 from public.requests
             where user_id = v_uid and category = p_category and need_type = p_need_type
               and created_at > now() - interval '10 minutes') then
    raise exception 'DUPLICATE_REQUEST';
  end if;

  insert into public.requests (user_id, category, need_type, budget_min, budget_max,
    distance_km, time_start, time_end, preferences, optional_note, verified_human, status)
  values (v_uid, p_category, p_need_type, p_budget_min, p_budget_max,
    p_distance_km, p_time_start, p_time_end, coalesce(p_preferences, '{}'), p_optional_note, p_verified_human, 'submitted')
  returning * into v_req;
  return v_req;
end;
$$;

create or replace function public.create_review(
  p_claim_id uuid, p_rating int, p_text text, p_tags text[] default '{}'
) returns public.reviews
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_claim public.claims;
  v_review public.reviews;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_claim from public.claims where id = p_claim_id;
  if not found then raise exception 'CLAIM_NOT_FOUND'; end if;
  if v_claim.user_id <> v_uid then raise exception 'NOT_YOUR_CLAIM'; end if;
  if v_claim.status <> 'redeemed' then raise exception 'NOT_REDEEMED'; end if;
  if exists (select 1 from public.reviews where claim_id = p_claim_id) then raise exception 'ALREADY_REVIEWED'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'BAD_RATING'; end if;
  if length(p_text) < 10 or length(p_text) > 300 then raise exception 'BAD_TEXT_LENGTH'; end if;

  insert into public.reviews (user_id, business_id, offer_id, claim_id, rating, text, tags, verified)
  values (v_uid, v_claim.business_id, v_claim.offer_id, p_claim_id, p_rating, p_text, coalesce(p_tags, '{}'), true)
  returning * into v_review;

  update public.businesses b set
    review_count = sub.cnt,
    rating_average = round(sub.avg, 2)
  from (select count(*) cnt, avg(rating)::numeric avg
        from public.reviews where business_id = v_claim.business_id) sub
  where b.id = v_claim.business_id;

  return v_review;
end;
$$;

revoke all on function public.submit_request(business_category, need_type, numeric, timestamptz, timestamptz, numeric, numeric, text[], text, boolean) from public, anon;
revoke all on function public.create_review(uuid, int, text, text[]) from public, anon;
grant execute on function public.submit_request(business_category, need_type, numeric, timestamptz, timestamptz, numeric, numeric, text[], text, boolean) to authenticated;
grant execute on function public.create_review(uuid, int, text, text[]) to authenticated;

-- ============================================================
-- supabase/seed.sql
-- ============================================================
-- Demo auth users (local only; hosted uses scripts/seed-auth-users.mjs).
-- The handle_new_user trigger creates matching profiles automatically.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, email_change, email_change_token_new, recovery_token) values
 ('00000000-0000-0000-0000-000000000000','d0000000-0000-0000-0000-0000000000c1','authenticated','authenticated','demo.customer@lattice.test', crypt('Demo1234!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"Demo Customer"}', '', '', '', ''),
 ('00000000-0000-0000-0000-000000000000','d0000000-0000-0000-0000-0000000000b1','authenticated','authenticated','demo.owner@lattice.test',   crypt('Demo1234!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"Demo Owner"}', '', '', '', '')
on conflict (id) do nothing;
insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at) values
 (gen_random_uuid(),'d0000000-0000-0000-0000-0000000000c1','d0000000-0000-0000-0000-0000000000c1', json_build_object('sub','d0000000-0000-0000-0000-0000000000c1','email','demo.customer@lattice.test'), 'email', now(), now(), now()),
 (gen_random_uuid(),'d0000000-0000-0000-0000-0000000000b1','d0000000-0000-0000-0000-0000000000b1', json_build_object('sub','d0000000-0000-0000-0000-0000000000b1','email','demo.owner@lattice.test'), 'email', now(), now(), now())
on conflict do nothing;

update public.profiles set role = 'businessOwner', verified = true where id = 'd0000000-0000-0000-0000-0000000000b1';
update public.profiles set onboarding_complete = true where id in ('d0000000-0000-0000-0000-0000000000c1','d0000000-0000-0000-0000-0000000000b1');

insert into public.businesses (id, name, category, description, address, location, rating_average, review_count, verified, price_level, tags, owner_user_id) values
 ('e0000000-0000-0000-0000-0000000000b1','FreshBowl','food','Build-your-own grain bowls','123 Main St','{"lat":29.42,"lng":-98.49}',4.6,1,true,2,'{"healthy","student-friendly"}','d0000000-0000-0000-0000-0000000000b1'),
 ('e0000000-0000-0000-0000-0000000000b2','Inkwell Books','retail','Indie bookshop & gifts','45 Elm Ave','{"lat":29.43,"lng":-98.50}',4.8,0,true,2,'{"gifts","books"}','d0000000-0000-0000-0000-0000000000b1')
on conflict (id) do nothing;

insert into public.offers (id, business_id, title, description, category, offer_type, price, original_price, valid_from, valid_until, max_claims, current_claims, tags, student_only, active) values
 ('f0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000b1','$3 off any bowl','Student special','food','studentOffer',6,9, now()-interval '2 days', now()+interval '10 days',50,1,'{"lunch"}',true,true),
 ('f0000000-0000-0000-0000-0000000000a2','e0000000-0000-0000-0000-0000000000b2','20% off one book','Any title','retail','discount',12,15, now()-interval '1 day', now()+interval '20 days',30,0,'{"books"}',false,true)
on conflict (id) do nothing;

-- one redeemed claim by the demo customer + a verified review on it
insert into public.claims (id, user_id, offer_id, business_id, claim_code, status, expires_at, redeemed_at) values
 ('aa000000-0000-0000-0000-0000000000c1','d0000000-0000-0000-0000-0000000000c1','f0000000-0000-0000-0000-0000000000a1','e0000000-0000-0000-0000-0000000000b1','PING-2468','redeemed', now()+interval '10 days', now()-interval '1 hour')
on conflict (id) do nothing;
insert into public.reviews (id, user_id, business_id, offer_id, claim_id, rating, text, tags, verified) values
 ('ab000000-0000-0000-0000-0000000000d1','d0000000-0000-0000-0000-0000000000c1','e0000000-0000-0000-0000-0000000000b1','f0000000-0000-0000-0000-0000000000a1','aa000000-0000-0000-0000-0000000000c1',5,'Fresh and fast, great student deal','{"Good value","Fast service"}',true)
on conflict (id) do nothing;


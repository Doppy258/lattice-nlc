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

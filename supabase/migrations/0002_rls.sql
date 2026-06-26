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
create view public.public_profiles as
  select id, name, role, verified from public.profiles;
grant select on public.public_profiles to authenticated;

-- Enable RLS
alter table public.profiles   enable row level security;
alter table public.businesses enable row level security;
alter table public.offers     enable row level security;
alter table public.claims     enable row level security;
alter table public.reviews    enable row level security;
alter table public.requests   enable row level security;

-- profiles: self only
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- businesses: read all (authenticated); write own
create policy businesses_select on public.businesses
  for select to authenticated using (true);
create policy businesses_insert_own on public.businesses
  for insert to authenticated with check (owner_user_id = auth.uid());
create policy businesses_update_own on public.businesses
  for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy businesses_delete_own on public.businesses
  for delete to authenticated using (owner_user_id = auth.uid());

-- offers: read all; write only via owning business
create policy offers_select on public.offers
  for select to authenticated using (true);
create policy offers_insert_owner on public.offers
  for insert to authenticated with check (public.is_business_owner(business_id));
create policy offers_update_owner on public.offers
  for update to authenticated using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy offers_delete_owner on public.offers
  for delete to authenticated using (public.is_business_owner(business_id));

-- claims: read own or as owning business; NO direct write (RPC only)
create policy claims_select on public.claims
  for select to authenticated using (user_id = auth.uid() or public.is_business_owner(business_id));

-- reviews: read all; NO direct write (RPC only)
create policy reviews_select on public.reviews
  for select to authenticated using (true);

-- requests: read own; NO direct write (RPC only)
create policy requests_select on public.requests
  for select to authenticated using (user_id = auth.uid());

-- Grant base privileges (RLS still gates rows). No insert/update/delete grant
-- on claims/reviews/requests => only SECURITY DEFINER RPCs can write them.
grant select on public.profiles, public.businesses, public.offers, public.claims, public.reviews, public.requests to authenticated;
grant insert, update, delete on public.businesses, public.offers to authenticated;
grant update on public.profiles to authenticated;

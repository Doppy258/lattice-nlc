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

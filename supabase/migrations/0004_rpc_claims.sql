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

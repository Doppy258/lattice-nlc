begin;
select plan(6);

-- Owner A + business + a customer C, via trigger
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000000','a1111111-1111-1111-1111-111111111111','authenticated','authenticated','owner@test.dev', crypt('x', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"Owner"}'),
 ('00000000-0000-0000-0000-000000000000','c2222222-2222-2222-2222-222222222222','authenticated','authenticated','cust@test.dev',  crypt('x', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"Cust"}');
update public.profiles set role='businessOwner' where id='a1111111-1111-1111-1111-111111111111';

insert into public.businesses (id, name, category, owner_user_id)
 values ('b3333333-3333-3333-3333-333333333333','Cafe','food','a1111111-1111-1111-1111-111111111111');
insert into public.offers (id, business_id, title, category, offer_type, price, valid_from, valid_until, max_claims)
 values ('00ffffff-0000-0000-0000-000000000001','b3333333-3333-3333-3333-333333333333','Bowl','food','discount',5, now()-interval '1 day', now()+interval '5 days', 1);

-- act as customer C
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

-- success: claim created, counter incremented
select lives_ok($$ select public.create_claim('00ffffff-0000-0000-0000-000000000001') $$, 'customer can claim');
select is((select current_claims from public.offers where id='00ffffff-0000-0000-0000-000000000001'), 1, 'counter incremented');

-- OFFER_FULL on second attempt (max_claims=1, already at 1)
select throws_ok($$ select public.create_claim('00ffffff-0000-0000-0000-000000000001') $$, 'OFFER_FULL', 'second claim blocked by limit');

-- redeem as the customer (not owner) -> NOT_YOUR_BUSINESS
select throws_ok(
  format($$ select public.redeem_claim(%L) $$, (select claim_code from public.claims limit 1)),
  'NOT_YOUR_BUSINESS', 'customer cannot redeem');

-- redeem as owner A -> success
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok(
  format($$ select public.redeem_claim(%L) $$, (select claim_code from public.claims limit 1)),
  'owner redeems claim');
select is((select status::text from public.claims limit 1), 'redeemed', 'claim marked redeemed');

select * from finish();
rollback;

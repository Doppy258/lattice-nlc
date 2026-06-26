begin;
select plan(4);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000000','a1111111-1111-1111-1111-111111111111','authenticated','authenticated','o@test.dev', crypt('x', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"O"}'),
 ('00000000-0000-0000-0000-000000000000','c2222222-2222-2222-2222-222222222222','authenticated','authenticated','c@test.dev', crypt('x', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"C"}');
update public.profiles set role='businessOwner' where id='a1111111-1111-1111-1111-111111111111';
insert into public.businesses (id, name, category, owner_user_id)
 values ('b3333333-3333-3333-3333-333333333333','Cafe','food','a1111111-1111-1111-1111-111111111111');
insert into public.offers (id, business_id, title, category, offer_type, price, valid_from, valid_until, max_claims)
 values ('00ffffff-0000-0000-0000-000000000001','b3333333-3333-3333-3333-333333333333','Bowl','food','discount',5, now()-interval '1 day', now()+interval '5 days', 5);
insert into public.claims (id, user_id, offer_id, business_id, claim_code, status, expires_at, redeemed_at)
 values ('cc000000-0000-0000-0000-000000000001','c2222222-2222-2222-2222-222222222222','00ffffff-0000-0000-0000-000000000001','b3333333-3333-3333-3333-333333333333','PING-1234','redeemed', now()+interval '5 days', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

-- submit_request happy path
select lives_ok($$ select public.submit_request('food','lunch', 3, now()+interval '1 hour', now()+interval '2 hour', null, 15, '{}'::text[], null, true) $$, 'request submitted');

-- duplicate within cooldown blocked
select throws_ok($$ select public.submit_request('food','lunch', 3, now()+interval '1 hour', now()+interval '2 hour', null, 15, '{}'::text[], null, true) $$, 'DUPLICATE_REQUEST', 'duplicate request blocked');

-- create_review on a redeemed claim succeeds and updates rating
select lives_ok($$ select public.create_review('cc000000-0000-0000-0000-000000000001', 5, 'Great bowl, fast service', '{"Good value"}'::text[]) $$, 'review created');
select is((select review_count from public.businesses where id='b3333333-3333-3333-3333-333333333333'), 1, 'business review_count recomputed');

select * from finish();
rollback;

begin;
select plan(4);

-- two auth users; the handle_new_user trigger creates their profiles
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111','authenticated','authenticated','a@test.dev', crypt('x', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"A"}'),
 ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222222','authenticated','authenticated','b@test.dev', crypt('x', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"B"}');
update public.profiles set role = 'businessOwner' where id = '11111111-1111-1111-1111-111111111111';
insert into public.businesses (id, name, category, owner_user_id)
 values ('33333333-3333-3333-3333-333333333333','A Cafe','food','11111111-1111-1111-1111-111111111111');

-- act as user B (a customer)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.businesses where id = '33333333-3333-3333-3333-333333333333'),
  1, 'authenticated user can read businesses');

select throws_ok(
  $$ insert into public.businesses (name, category, owner_user_id)
     values ('Fake','food','11111111-1111-1111-1111-111111111111') $$,
  '42501', NULL, 'customer cannot create a business owned by someone else');

select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  0, 'cannot read another user profile row');

select is(
  (select name from public.public_profiles where id = '11111111-1111-1111-1111-111111111111'),
  'A', 'display name visible via public_profiles');

select * from finish();
rollback;

begin;
select plan(2);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000','44444444-4444-4444-4444-444444444444','authenticated','authenticated','new@test.dev', crypt('x', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{"name":"New User"}');

select is((select count(*)::int from public.profiles where id = '44444444-4444-4444-4444-444444444444'), 1, 'profile auto-created on signup');
select is((select name from public.profiles where id = '44444444-4444-4444-4444-444444444444'), 'New User', 'name copied from user metadata');

select * from finish();
rollback;

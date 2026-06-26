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

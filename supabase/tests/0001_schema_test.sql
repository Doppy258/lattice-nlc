begin;
select plan(8);

select has_table('public', 'profiles',   'profiles table exists');
select has_table('public', 'businesses', 'businesses table exists');
select has_table('public', 'offers',     'offers table exists');
select has_table('public', 'claims',     'claims table exists');
select has_table('public', 'reviews',    'reviews table exists');
select has_table('public', 'requests',   'requests table exists');
select has_type('public', 'claim_status', 'claim_status enum exists');
select col_is_unique('public', 'claims', 'claim_code', 'claim_code is unique');

select * from finish();
rollback;

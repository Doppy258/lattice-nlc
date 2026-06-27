-- ============================================================================
-- reset_catalog.sql — wipe ALL businesses, offers, and their dependent rows
-- from the shared Supabase database.
--
-- WHY: the app merges live Supabase rows on top of the local seed catalog
-- ("live wins"). Any business/offer created at runtime lives in Supabase and
-- would keep showing up next to the new seed catalog. Run this once to clear it
-- so only the new San Antonio seed catalog appears.
--
-- HOW TO RUN:
--   1. Open your Supabase project dashboard → SQL Editor → New query.
--   2. Paste this whole file and click "Run".
--   (The SQL Editor runs with elevated privileges, so row-level security does
--    not block these deletes.)
--
-- SAFE TO RE-RUN. Deletes are ordered so foreign-key constraints are satisfied
-- (children before parents). This does NOT touch user accounts/auth.
-- ============================================================================

begin;

-- saved/bookmarked items (reference offers + businesses)
delete from saved_offers;
delete from saved_businesses;

-- activity that references offers/businesses
delete from reviews;
delete from claims;
delete from rankings;

-- ping requests (customer "Create a Lattice" submissions)
delete from ping_requests;

-- the catalog itself: offers reference businesses, so offers first
delete from offers;
delete from businesses;

commit;

-- Verify everything is empty (each count should be 0):
select
  (select count(*) from businesses)        as businesses,
  (select count(*) from offers)            as offers,
  (select count(*) from claims)            as claims,
  (select count(*) from reviews)           as reviews,
  (select count(*) from rankings)          as rankings,
  (select count(*) from ping_requests)     as ping_requests,
  (select count(*) from saved_businesses)  as saved_businesses,
  (select count(*) from saved_offers)      as saved_offers;

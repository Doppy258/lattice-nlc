-- Add the specific customer need an offer serves (e.g. "lunch", "haircut").
-- Nullable: existing rows have no declared need and fall back to a plain
-- category match in the OfferRank scoring.
alter table public.offers
  add column if not exists need_type text;

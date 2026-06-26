-- Add discount-kind support to offers.
-- Existing rows default to a fixed-price discount, matching prior behavior.
alter table public.offers
  add column if not exists discount_kind text not null default 'fixedPrice',
  add column if not exists percent_off numeric(5,2),
  add column if not exists amount_off numeric(10,2);

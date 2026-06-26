-- Demo seed for the verified-redemption flow: Luna Cafe + a one-time
-- "20% off any drink" offer with a 5-minute pass window and a 50-redemption cap.
-- Run AFTER demo_data.sql (needs owner_sam) and migrations 002 + 003.
-- Safe to run multiple times.

INSERT INTO public.businesses
  (id, name, category, description, address, location, hours, rating_average, review_count, verified, price_level, tags, accessibility_features, owner_user_id, created_at)
VALUES
  ('biz_lunacafe', 'Luna Cafe', 'food',
   'Cozy neighborhood cafe pouring single-origin coffee and fresh-pressed drinks.',
   '210 Broadway St, San Antonio, TX',
   '{"lat":29.4260,"lng":-98.4861}',
   '[{"dayOfWeek":0,"openTime":"07:00","closeTime":"19:00"},{"dayOfWeek":1,"openTime":"07:00","closeTime":"19:00"},{"dayOfWeek":2,"openTime":"07:00","closeTime":"19:00"},{"dayOfWeek":3,"openTime":"07:00","closeTime":"19:00"},{"dayOfWeek":4,"openTime":"07:00","closeTime":"19:00"},{"dayOfWeek":5,"openTime":"07:00","closeTime":"19:00"},{"dayOfWeek":6,"openTime":"07:00","closeTime":"19:00"}]',
   4.7, 28, true, 2, '{coffee,drinks,student-friendly,cozy}', '{wheelchairAccessible}', 'owner_sam', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.offers
  (id, business_id, title, description, category, offer_type, price, original_price, valid_from, valid_until, max_claims, current_claims, views, tags, student_only, verification_required, one_time_per_user, redemption_window_minutes, active, created_at)
VALUES
  ('offer_lunacafe_drink', 'biz_lunacafe', '20% off any drink',
   'Take 20% off any handcrafted drink — lattes, cold brew, fresh juice, or a seasonal special.',
   'food', 'discount', 4.00, 5.00,
   now() - interval '1 day', now() + interval '30 days',
   50, 0, 86, '{coffee,drinks,student-friendly}', false, true, true, 5, true, now())
ON CONFLICT (id) DO NOTHING;

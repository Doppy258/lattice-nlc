-- Add onboarded column (if not already added by migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false;
UPDATE users SET onboarded = COALESCE(onboarding_complete, false);
ALTER TABLE users ALTER COLUMN onboarded SET NOT NULL;

-- Disable RLS on all tables so the app can read/write
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE ping_requests DISABLE ROW LEVEL SECURITY;

-- Grant schema usage to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant full table permissions to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Make sure future tables also get these grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

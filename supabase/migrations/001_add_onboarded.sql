ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded boolean DEFAULT false;

-- Copy existing onboarding_complete values to the new column
UPDATE users SET onboarded = COALESCE(onboarding_complete, false);

-- Make the column NOT NULL going forward
ALTER TABLE users ALTER COLUMN onboarded SET NOT NULL;

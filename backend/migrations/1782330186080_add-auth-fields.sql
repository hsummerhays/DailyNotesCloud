-- Up Migration
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Down Migration
ALTER TABLE users DROP COLUMN IF EXISTS google_id;
-- If there are rows where password_hash is null, setting it to NOT NULL will fail.
-- In development, we can safely set it back to NOT NULL, but we'll run a safety update first.
UPDATE users SET password_hash = '$2b$10$MOCKHASHPASSWORDPLACEHOLDER' WHERE password_hash IS NULL;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
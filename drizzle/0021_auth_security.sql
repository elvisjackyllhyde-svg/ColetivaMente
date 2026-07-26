ALTER TABLE users ADD COLUMN email_verified_at text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN two_factor_secret text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN two_factor_enabled integer NOT NULL DEFAULT 0;
UPDATE users SET email_verified_at = CURRENT_TIMESTAMP;
CREATE TABLE auth_tokens (
  token text PRIMARY KEY NOT NULL,
  user_id integer NOT NULL REFERENCES users(id),
  purpose text NOT NULL,
  secret text NOT NULL DEFAULT '',
  expires_at text NOT NULL,
  created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX auth_tokens_user_purpose ON auth_tokens(user_id, purpose);

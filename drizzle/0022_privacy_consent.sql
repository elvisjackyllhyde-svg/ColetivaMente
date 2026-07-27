ALTER TABLE users ADD COLUMN privacy_accepted_at text NOT NULL DEFAULT '';
ALTER TABLE participants ADD COLUMN consented_at text NOT NULL DEFAULT '';
ALTER TABLE raffle_entries ADD COLUMN consented_at text NOT NULL DEFAULT '';
ALTER TABLE players ADD COLUMN consented_at text NOT NULL DEFAULT '';

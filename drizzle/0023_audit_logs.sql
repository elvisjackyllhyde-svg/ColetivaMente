CREATE TABLE audit_logs (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  category text NOT NULL,
  action text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  actor_user_id integer,
  target_user_id integer,
  resource_type text NOT NULL DEFAULT '',
  resource_id text NOT NULL DEFAULT '',
  ip_hash text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  metadata_json text NOT NULL DEFAULT '{}',
  created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id)
);
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at);
CREATE INDEX audit_logs_category_idx ON audit_logs (category);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_user_id);

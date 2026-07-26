CREATE TABLE `login_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`window_started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`blocked_until` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_rate_limits_updated_at_idx` ON `login_rate_limits` (`updated_at`);

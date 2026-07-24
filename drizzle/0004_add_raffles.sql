CREATE TABLE `raffles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`admin_token` text NOT NULL,
	`title` text NOT NULL,
	`prize_title` text DEFAULT '' NOT NULL,
	`prize_description` text DEFAULT '' NOT NULL,
	`winners_count` integer DEFAULT 1 NOT NULL,
	`closed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `raffles_slug_unique` ON `raffles` (`slug`);--> statement-breakpoint
CREATE TABLE `raffle_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`raffle_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`is_winner` integer DEFAULT false NOT NULL,
	`winner_position` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`raffle_id`) REFERENCES `raffles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_email_per_raffle` ON `raffle_entries` (`raffle_id`,`email`);

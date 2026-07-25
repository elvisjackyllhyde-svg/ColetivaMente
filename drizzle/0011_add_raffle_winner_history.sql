CREATE TABLE `raffle_winner_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`raffle_id` integer NOT NULL,
	`draw_id` text NOT NULL,
	`entry_id` integer,
	`winner_name` text NOT NULL,
	`position` integer NOT NULL,
	`drawn_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`raffle_id`) REFERENCES `raffles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entry_id`) REFERENCES `raffle_entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `raffle_history_raffle_idx` ON `raffle_winner_history` (`raffle_id`);

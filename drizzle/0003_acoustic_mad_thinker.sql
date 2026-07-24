CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`option_id` integer NOT NULL,
	`category` text NOT NULL,
	`voter_id` text NOT NULL,
	`comment` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`option_id`) REFERENCES `options`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_opinion_per_category` ON `feedback` (`campaign_id`,`voter_id`,`category`);--> statement-breakpoint
ALTER TABLE `campaigns` ADD `feedback_open` integer DEFAULT false NOT NULL;

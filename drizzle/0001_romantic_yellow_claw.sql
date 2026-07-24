DROP INDEX `one_vote_per_campaign`;--> statement-breakpoint
ALTER TABLE `votes` ADD `category` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `one_vote_per_category` ON `votes` (`campaign_id`,`voter_id`,`category`);

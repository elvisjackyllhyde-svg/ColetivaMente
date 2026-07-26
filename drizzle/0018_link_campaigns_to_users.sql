ALTER TABLE `campaigns` ADD `creator_user_id` integer;
--> statement-breakpoint
CREATE INDEX `campaigns_creator_user_idx` ON `campaigns` (`creator_user_id`);

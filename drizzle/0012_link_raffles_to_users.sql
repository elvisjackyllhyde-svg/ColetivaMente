ALTER TABLE `raffles` ADD `creator_user_id` integer;
--> statement-breakpoint
CREATE INDEX `raffles_creator_user_idx` ON `raffles` (`creator_user_id`);

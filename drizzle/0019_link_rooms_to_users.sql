ALTER TABLE `rooms` ADD `creator_user_id` integer;
--> statement-breakpoint
CREATE INDEX `rooms_creator_user_idx` ON `rooms` (`creator_user_id`);

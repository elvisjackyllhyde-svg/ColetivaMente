ALTER TABLE `quiz_configs` ADD `music_track` text DEFAULT 'tic-tac-quiz' NOT NULL;
--> statement-breakpoint
ALTER TABLE `quiz_configs` ADD `music_scope` text DEFAULT 'all' NOT NULL;

CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`host_key` text NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`question_index` integer DEFAULT -1 NOT NULL,
	`started_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_code_unique` ON `rooms` (`code`);--> statement-breakpoint
CREATE TABLE `quiz_configs` (
	`room_id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`questions_json` text
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`player_key` text NOT NULL,
	`name` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`joined_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_room_name` ON `players` (`room_id`,`name`);--> statement-breakpoint
CREATE TABLE `answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`question_index` integer NOT NULL,
	`option` integer NOT NULL,
	`correct` integer NOT NULL,
	`points` integer NOT NULL,
	`answered_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_answer_per_question` ON `answers` (`room_id`,`player_id`,`question_index`);

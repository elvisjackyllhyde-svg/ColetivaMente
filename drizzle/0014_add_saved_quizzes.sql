CREATE TABLE `saved_quizzes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`questions_json` text NOT NULL,
	`music_track` text DEFAULT 'tic-tac-quiz' NOT NULL,
	`music_scope` text DEFAULT 'all' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
CREATE UNIQUE INDEX `saved_quiz_user_title` ON `saved_quizzes` (`user_id`,`title`);

ALTER TABLE `payments` ADD `access_granted_at` text;
--> statement-breakpoint
UPDATE `payments`
SET `access_granted_at` = COALESCE(`approved_at`, `updated_at`)
WHERE `status` = 'approved';

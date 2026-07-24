ALTER TABLE `users` ADD `subscription_expires_at` text;
UPDATE `users`
SET `subscription_expires_at` = datetime('now', '+30 days')
WHERE `subscription_status` = 'active' AND `is_admin` = 0;

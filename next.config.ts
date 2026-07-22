ALTER TABLE `publication_jobs` ADD `dedupe_key` text;--> statement-breakpoint
ALTER TABLE `publication_jobs` ADD `payload_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `publication_jobs` ADD `external_post_id` text;--> statement-breakpoint
ALTER TABLE `publication_jobs` ADD `attempt_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `publication_jobs` ADD `last_attempt_at` text;--> statement-breakpoint
ALTER TABLE `publication_jobs` ADD `approved_by` text DEFAULT 'editor' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `publication_jobs_dedupe_uidx` ON `publication_jobs` (`dedupe_key`);

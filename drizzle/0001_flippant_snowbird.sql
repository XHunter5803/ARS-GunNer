ALTER TABLE `sources` ADD `source_type` text DEFAULT 'outlet' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `reliability_weight` integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `last_fetched_at` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `last_error` text;
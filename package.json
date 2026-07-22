CREATE TABLE `article_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`revision_no` integer NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_revision_uidx` ON `article_revisions` (`article_id`,`revision_no`);--> statement-breakpoint
CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cluster_id` integer,
	`language` text NOT NULL,
	`pattern` text DEFAULT 'perspective' NOT NULL,
	`category` text NOT NULL,
	`label` text DEFAULT 'มุมมอง' NOT NULL,
	`headline` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`readiness_score` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`cluster_id`) REFERENCES `event_clusters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `articles_status_idx` ON `articles` (`status`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_events_entity_idx` ON `audit_events` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `cluster_items` (
	`cluster_id` integer NOT NULL,
	`feed_item_id` integer NOT NULL,
	PRIMARY KEY(`cluster_id`, `feed_item_id`),
	FOREIGN KEY (`cluster_id`) REFERENCES `event_clusters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`feed_item_id`) REFERENCES `feed_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `delivery_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` integer NOT NULL,
	`attempt_no` integer NOT NULL,
	`status` text NOT NULL,
	`response_code` integer,
	`response_message` text,
	`attempted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `publication_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `delivery_attempts_job_idx` ON `delivery_attempts` (`job_id`);--> statement-breakpoint
CREATE TABLE `event_clusters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cluster_key` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`viral_score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_clusters_key_uidx` ON `event_clusters` (`cluster_key`);--> statement-breakpoint
CREATE INDEX `event_clusters_status_idx` ON `event_clusters` (`status`);--> statement-breakpoint
CREATE TABLE `fact_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cluster_id` integer NOT NULL,
	`confirmed_facts_json` text DEFAULT '[]' NOT NULL,
	`reported_claims_json` text DEFAULT '[]' NOT NULL,
	`conflicts_json` text DEFAULT '[]' NOT NULL,
	`confidence_score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`cluster_id`) REFERENCES `event_clusters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `fact_checks_cluster_idx` ON `fact_checks` (`cluster_id`);--> statement-breakpoint
CREATE TABLE `favorite_filters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`label` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `favorite_kind_value_uidx` ON `favorite_filters` (`kind`,`value`);--> statement-breakpoint
CREATE TABLE `feed_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` integer,
	`canonical_url` text NOT NULL,
	`headline` text NOT NULL,
	`reporter` text,
	`language` text NOT NULL,
	`published_at` text,
	`raw_text` text DEFAULT '' NOT NULL,
	`clean_text` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_items_canonical_url_uidx` ON `feed_items` (`canonical_url`);--> statement-breakpoint
CREATE INDEX `feed_items_published_at_idx` ON `feed_items` (`published_at`);--> statement-breakpoint
CREATE TABLE `publication_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`article_id` integer NOT NULL,
	`channel` text NOT NULL,
	`scheduled_at` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`preview_text` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `publication_jobs_status_idx` ON `publication_jobs` (`status`,`scheduled_at`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`homepage_url` text NOT NULL,
	`feed_url` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sources_feed_url_uidx` ON `sources` (`feed_url`);
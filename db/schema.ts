import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const favoriteFilters = sqliteTable(
  "favorite_filters",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["keyword", "outlet", "reporter"] }).notNull(),
    value: text("value").notNull(),
    label: text("label").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("favorite_kind_value_uidx").on(table.kind, table.value)],
);

export const sources = sqliteTable(
  "sources",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    homepageUrl: text("homepage_url").notNull(),
    feedUrl: text("feed_url").notNull(),
    sourceType: text("source_type", {
      enum: ["official", "original", "reporter", "outlet"],
    })
      .notNull()
      .default("outlet"),
    reliabilityWeight: integer("reliability_weight").notNull().default(50),
    status: text("status", { enum: ["active", "paused", "error"] })
      .notNull()
      .default("active"),
    lastFetchedAt: text("last_fetched_at"),
    lastError: text("last_error"),
    ...timestamps,
  },
  (table) => [uniqueIndex("sources_feed_url_uidx").on(table.feedUrl)],
);

export const feedItems = sqliteTable(
  "feed_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceId: integer("source_id").references(() => sources.id),
    canonicalUrl: text("canonical_url").notNull(),
    headline: text("headline").notNull(),
    reporter: text("reporter"),
    language: text("language", { enum: ["th", "en", "other"] }).notNull(),
    publishedAt: text("published_at"),
    rawText: text("raw_text").notNull().default(""),
    cleanText: text("clean_text").notNull().default(""),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("feed_items_canonical_url_uidx").on(table.canonicalUrl),
    index("feed_items_published_at_idx").on(table.publishedAt),
  ],
);

export const eventClusters = sqliteTable(
  "event_clusters",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clusterKey: text("cluster_key").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    viralScore: integer("viral_score").notNull().default(0),
    status: text("status", { enum: ["new", "reviewing", "ready", "archived"] })
      .notNull()
      .default("new"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("event_clusters_key_uidx").on(table.clusterKey),
    index("event_clusters_status_idx").on(table.status),
  ],
);

export const clusterItems = sqliteTable(
  "cluster_items",
  {
    clusterId: integer("cluster_id")
      .notNull()
      .references(() => eventClusters.id, { onDelete: "cascade" }),
    feedItemId: integer("feed_item_id")
      .notNull()
      .references(() => feedItems.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.clusterId, table.feedItemId] })],
);

export const factChecks = sqliteTable(
  "fact_checks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clusterId: integer("cluster_id")
      .notNull()
      .references(() => eventClusters.id, { onDelete: "cascade" }),
    confirmedFactsJson: text("confirmed_facts_json").notNull().default("[]"),
    reportedClaimsJson: text("reported_claims_json").notNull().default("[]"),
    conflictsJson: text("conflicts_json").notNull().default("[]"),
    confidenceScore: integer("confidence_score").notNull().default(0),
    status: text("status", { enum: ["pending", "review", "verified", "blocked"] })
      .notNull()
      .default("pending"),
    ...timestamps,
  },
  (table) => [index("fact_checks_cluster_idx").on(table.clusterId)],
);

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clusterId: integer("cluster_id").references(() => eventClusters.id),
    language: text("language", { enum: ["th", "en", "bilingual"] }).notNull(),
    pattern: text("pattern").notNull().default("perspective"),
    category: text("category").notNull(),
    label: text("label").notNull().default("มุมมอง"),
    headline: text("headline").notNull(),
    status: text("status", {
      enum: ["draft", "review", "approved", "scheduled", "published", "rejected"],
    })
      .notNull()
      .default("draft"),
    readinessScore: integer("readiness_score").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("articles_status_idx").on(table.status)],
);

export const articleRevisions = sqliteTable(
  "article_revisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    revisionNo: integer("revision_no").notNull(),
    payloadJson: text("payload_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("article_revision_uidx").on(table.articleId, table.revisionNo)],
);

export const publicationJobs = sqliteTable(
  "publication_jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: ["telegram"] }).notNull(),
    // Nullable for compatibility with publication jobs created before Phase 4.
    // Every new job still receives a deterministic key from the API.
    dedupeKey: text("dedupe_key"),
    scheduledAt: text("scheduled_at"),
    status: text("status", { enum: ["queued", "sending", "sent", "failed", "cancelled"] })
      .notNull()
      .default("queued"),
    previewText: text("preview_text").notNull().default(""),
    payloadJson: text("payload_json").notNull().default("{}"),
    externalPostId: text("external_post_id"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastAttemptAt: text("last_attempt_at"),
    approvedBy: text("approved_by").notNull().default("editor"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("publication_jobs_dedupe_uidx").on(table.dedupeKey),
    index("publication_jobs_status_idx").on(table.status, table.scheduledAt),
  ],
);

export const deliveryAttempts = sqliteTable(
  "delivery_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    jobId: integer("job_id")
      .notNull()
      .references(() => publicationJobs.id, { onDelete: "cascade" }),
    attemptNo: integer("attempt_no").notNull(),
    status: text("status", { enum: ["sent", "failed"] }).notNull(),
    responseCode: integer("response_code"),
    responseMessage: text("response_message"),
    attemptedAt: text("attempted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("delivery_attempts_job_idx").on(table.jobId)],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    detailJson: text("detail_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("audit_events_entity_idx").on(table.entityType, table.entityId)],
);

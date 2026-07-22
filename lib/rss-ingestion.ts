import { XMLParser } from "fast-xml-parser";
import { canonicalizeUrl, cleanArticleText } from "./news-pipeline";
import { isSafePublicHttpsUrl } from "./security";

export type ParsedFeedItem = {
  title: string;
  url: string;
  reporter: string | null;
  publishedAt: string | null;
  rawText: string;
  cleanText: string;
  language: "th" | "en" | "other";
};

type UnknownRecord = Record<string, unknown>;

type SourceRow = {
  id: number;
  name: string;
  feed_url: string;
};

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function asText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;|&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .trim();
  }
  if (value && typeof value === "object") {
    const record = value as UnknownRecord;
    return asText(record["#text"] ?? record.__cdata ?? "");
  }
  return "";
}

function atomLink(value: unknown) {
  for (const link of toArray(value)) {
    if (typeof link === "string") return link;
    const record = asRecord(link);
    const rel = asText(record["@_rel"] ?? record.rel ?? "alternate");
    const href = asText(record["@_href"] ?? record.href);
    if (href && (!rel || rel === "alternate")) return href;
  }
  return "";
}

function resolveItemUrl(value: string, feedUrl: string) {
  try {
    const resolved = new URL(value, feedUrl);
    return canonicalizeUrl(resolved.toString());
  } catch {
    return "";
  }
}

function detectLanguage(value: string): ParsedFeedItem["language"] {
  const thai = (value.match(/[ก-๙]/g) ?? []).length;
  const latin = (value.match(/[A-Za-z]/g) ?? []).length;
  if (thai > latin * 0.25) return "th";
  if (latin > 10) return "en";
  return "other";
}

function isoDate(value: string) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function parseRssXml(xml: string, feedUrl: string): ParsedFeedItem[] {
  if (!xml.trim() || xml.length > 1_000_000) throw new Error("RSS_XML_SIZE_INVALID");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    trimValues: true,
    processEntities: false,
    allowBooleanAttributes: false,
  });
  const parsed = asRecord(parser.parse(xml));
  const rssChannel = asRecord(asRecord(parsed.rss).channel);
  const atomFeed = asRecord(parsed.feed);
  const rssItems = toArray(rssChannel.item);
  const atomItems = toArray(atomFeed.entry);
  const items = rssItems.length ? rssItems : atomItems;

  return items.slice(0, 50).flatMap((rawItem) => {
    const item = asRecord(rawItem);
    const title = cleanArticleText(asText(item.title)).slice(0, 500);
    const rawUrl = asText(item.link) || atomLink(item.link) || asText(item.guid) || asText(item.id);
    const url = resolveItemUrl(rawUrl, feedUrl);
    if (!title || !url) return [];
    const rawText = asText(item["content:encoded"] ?? item.content ?? item.description ?? item.summary).slice(0, 30_000);
    const cleanText = cleanArticleText(rawText);
    const reporter = asText(item["dc:creator"] ?? item.author ?? item.creator).slice(0, 160) || null;
    const publishedAt = isoDate(asText(item.pubDate ?? item.published ?? item.updated ?? item.date));
    return [{
      title,
      url,
      reporter,
      publishedAt,
      rawText,
      cleanText,
      language: detectLanguage(`${title}\n${cleanText}`),
    } satisfies ParsedFeedItem];
  });
}

async function fetchFeed(feedUrl: string) {
  if (!isSafePublicHttpsUrl(feedUrl)) throw new Error("UNSAFE_FEED_URL");
  const response = await fetch(feedUrl, {
    headers: {
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
      "user-agent": "ARS-GunNer/0.3 (+RSS newsroom fetcher)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`RSS_HTTP_${response.status}`);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/html")) throw new Error("RSS_RETURNED_HTML");
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > 1_000_000) throw new Error("RSS_TOO_LARGE");
  const xml = await response.text();
  if (new TextEncoder().encode(xml).byteLength > 1_000_000) throw new Error("RSS_TOO_LARGE");
  return xml;
}

export async function runRssIngestion(db: D1Database, limit = 8) {
  const sourceResult = await db
    .prepare("SELECT id, name, feed_url FROM sources WHERE status = 'active' ORDER BY reliability_weight DESC, id ASC LIMIT ?")
    .bind(Math.min(Math.max(limit, 1), 12))
    .all<SourceRow>();
  const sourceRows = sourceResult.results ?? [];
  const result = { sources_checked: sourceRows.length, sources_succeeded: 0, sources_failed: 0, items_seen: 0, items_inserted: 0, errors: [] as Array<{ source_id: number; message: string }> };

  for (const source of sourceRows) {
    try {
      const xml = await fetchFeed(source.feed_url);
      const items = parseRssXml(xml, source.feed_url).slice(0, 25);
      result.items_seen += items.length;
      if (items.length) {
        const statements = items.map((item) => db.prepare(
          "INSERT INTO feed_items (source_id, canonical_url, headline, reporter, language, published_at, raw_text, clean_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(canonical_url) DO NOTHING",
        ).bind(source.id, item.url, item.title, item.reporter, item.language, item.publishedAt, item.rawText, item.cleanText));
        const batch = await db.batch(statements);
        result.items_inserted += batch.reduce((sum, entry) => sum + Number(entry.meta.changes ?? 0), 0);
      }
      await db.prepare("UPDATE sources SET last_fetched_at = CURRENT_TIMESTAMP, last_error = NULL, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(source.id).run();
      result.sources_succeeded += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 300) : "RSS_FETCH_FAILED";
      await db.prepare("UPDATE sources SET last_fetched_at = CURRENT_TIMESTAMP, last_error = ?, status = 'error', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(message, source.id).run();
      result.sources_failed += 1;
      result.errors.push({ source_id: source.id, message });
    }
  }

  await db.prepare("INSERT INTO audit_events (actor, action, entity_type, entity_id, detail_json) VALUES ('system', 'rss.ingest', 'cron_run', ?, ?)")
    .bind(crypto.randomUUID(), JSON.stringify(result))
    .run();
  return result;
}

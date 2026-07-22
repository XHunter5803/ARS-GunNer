import { apiError, apiJson } from "../../../../lib/api-response";

type RuntimeBindings = { DB?: D1Database };

type DashboardSummary = {
  reports_total: number;
  reports_today: number;
  event_clusters: number;
  ready_articles: number;
  publishing_queue: number;
};

type DiscoveryRow = {
  id: number;
  headline: string;
  canonical_url: string;
  reporter: string | null;
  language: "th" | "en" | "other";
  published_at: string | null;
  clean_text: string;
  created_at: string;
  source_name: string | null;
  source_type: string | null;
  reliability_weight: number | null;
};

export async function GET(request: Request) {
  try {
    const { env } = await import("cloudflare:workers") as unknown as { env: RuntimeBindings };
    if (!env.DB) return apiError(503, "DATABASE_UNAVAILABLE", "ไม่พบ D1 binding DB");

    const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 25);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 25;

    const [summary, itemResult] = await Promise.all([
      env.DB.prepare(`
        SELECT
          (SELECT COUNT(*) FROM feed_items) AS reports_total,
          (SELECT COUNT(*) FROM feed_items WHERE date(COALESCE(published_at, created_at)) = date('now')) AS reports_today,
          (SELECT COUNT(*) FROM event_clusters WHERE status != 'archived') AS event_clusters,
          (SELECT COUNT(*) FROM articles WHERE status = 'approved' AND readiness_score >= 85) AS ready_articles,
          (SELECT COUNT(*) FROM publication_jobs WHERE status IN ('queued', 'sending')) AS publishing_queue
      `).first<DashboardSummary>(),
      env.DB.prepare(`
        SELECT
          feed_items.id,
          feed_items.headline,
          feed_items.canonical_url,
          feed_items.reporter,
          feed_items.language,
          feed_items.published_at,
          feed_items.clean_text,
          feed_items.created_at,
          sources.name AS source_name,
          sources.source_type,
          sources.reliability_weight
        FROM feed_items
        LEFT JOIN sources ON sources.id = feed_items.source_id
        ORDER BY COALESCE(feed_items.published_at, feed_items.created_at) DESC, feed_items.id DESC
        LIMIT ?
      `).bind(limit).all<DiscoveryRow>(),
    ]);

    return apiJson({
      summary: summary ?? {
        reports_total: 0,
        reports_today: 0,
        event_clusters: 0,
        ready_articles: 0,
        publishing_queue: 0,
      },
      items: itemResult.results ?? [],
    });
  } catch {
    return apiError(500, "DISCOVERY_LOAD_FAILED", "โหลด Discovery feed ไม่สำเร็จ");
  }
}

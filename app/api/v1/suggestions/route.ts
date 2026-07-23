import { apiJson, databaseError } from "../../../../lib/api-response";

type SuggestionRow = {
  value: string;
  article_count: number;
  reliability_weight: number;
  last_seen: string | null;
};

type RuntimeBindings = { DB?: D1Database };

function dayInBangkok() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function mapSuggestion(kind: "reporter" | "outlet", row: SuggestionRow) {
  const count = Number(row.article_count) || 0;
  const reliability = Number(row.reliability_weight) || 50;
  return {
    kind,
    value: row.value,
    label: row.value,
    score: Math.min(100, Math.round(reliability * 0.65 + Math.min(35, count * 7))),
    article_count: count,
    last_seen: row.last_seen,
    reason: kind === "reporter"
      ? `พบชื่อในข่าวล่าสุด ${count} รายการ · เหมาะสำหรับติดตามรายงานต้นทางเพิ่มเติม`
      : `มีข่าวใหม่ ${count} รายการ · Reliability weight ${reliability}`,
  };
}

export async function GET() {
  try {
    const { env } = await import("cloudflare:workers") as unknown as { env: RuntimeBindings };
    if (!env.DB) throw new Error("D1 binding DB is unavailable");

    const [reporterResult, outletResult] = await Promise.all([
      env.DB.prepare(`
        SELECT
          TRIM(fi.reporter) AS value,
          COUNT(*) AS article_count,
          CAST(AVG(COALESCE(s.reliability_weight, 50)) AS INTEGER) AS reliability_weight,
          MAX(COALESCE(fi.published_at, fi.created_at)) AS last_seen
        FROM feed_items fi
        LEFT JOIN sources s ON s.id = fi.source_id
        WHERE fi.reporter IS NOT NULL
          AND LENGTH(TRIM(fi.reporter)) >= 2
          AND datetime(COALESCE(fi.published_at, fi.created_at)) >= datetime('now', '-14 days')
          AND NOT EXISTS (
            SELECT 1 FROM favorite_filters f
            WHERE f.kind = 'reporter' AND LOWER(TRIM(f.value)) = LOWER(TRIM(fi.reporter))
          )
        GROUP BY LOWER(TRIM(fi.reporter))
        ORDER BY article_count DESC, reliability_weight DESC, last_seen DESC
        LIMIT 5
      `).all<SuggestionRow>(),
      env.DB.prepare(`
        SELECT
          s.name AS value,
          COUNT(fi.id) AS article_count,
          s.reliability_weight AS reliability_weight,
          MAX(COALESCE(fi.published_at, fi.created_at)) AS last_seen
        FROM sources s
        JOIN feed_items fi ON fi.source_id = s.id
        WHERE s.status = 'active'
          AND datetime(COALESCE(fi.published_at, fi.created_at)) >= datetime('now', '-14 days')
          AND NOT EXISTS (
            SELECT 1 FROM favorite_filters f
            WHERE f.kind = 'outlet' AND LOWER(TRIM(f.value)) = LOWER(TRIM(s.name))
          )
        GROUP BY s.id, s.name, s.reliability_weight
        ORDER BY article_count DESC, s.reliability_weight DESC, last_seen DESC
        LIMIT 5
      `).all<SuggestionRow>(),
    ]);

    return apiJson({
      day: dayInBangkok(),
      suggestions: {
        reporters: (reporterResult.results ?? []).map((row: SuggestionRow) => mapSuggestion("reporter", row)),
        outlets: (outletResult.results ?? []).map((row: SuggestionRow) => mapSuggestion("outlet", row)),
      },
    });
  } catch (error) {
    return databaseError(error);
  }
}

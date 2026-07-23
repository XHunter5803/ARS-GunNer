import { apiJson, databaseError } from "../../../../lib/api-response";
import { isFootballReport } from "../../../../lib/football-filter";

type SuggestionRow = {
  value: string;
  article_count: number;
  reliability_weight: number;
  last_seen: string | null;
};

type RuntimeBindings = { DB?: D1Database };

type RecentReportRow = {
  reporter: string | null;
  source_name: string;
  reliability_weight: number;
  headline: string;
  clean_text: string;
  canonical_url: string;
  last_seen: string | null;
};

type FavoriteRow = {
  kind: "reporter" | "outlet";
  value: string;
};

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

    const [newsResult, favoriteResult] = await Promise.all([
      env.DB.prepare(`
        SELECT
          fi.reporter,
          s.name AS source_name,
          s.reliability_weight,
          fi.headline,
          fi.clean_text,
          fi.canonical_url,
          COALESCE(fi.published_at, fi.created_at) AS last_seen
        FROM feed_items fi
        JOIN sources s ON s.id = fi.source_id
        WHERE s.status = 'active'
          AND datetime(COALESCE(fi.published_at, fi.created_at)) >= datetime('now', '-14 days')
        ORDER BY datetime(COALESCE(fi.published_at, fi.created_at)) DESC
        LIMIT 300
      `).all<RecentReportRow>(),
      env.DB.prepare(`
        SELECT kind, value
        FROM favorite_filters
        WHERE is_active = 1 AND kind IN ('reporter', 'outlet')
      `).all<FavoriteRow>(),
    ]);

    const favorites = new Set((favoriteResult.results ?? []).map((row) => `${row.kind}:${row.value.trim().toLocaleLowerCase("en-US")}`));
    const footballReports = (newsResult.results ?? []).filter((row) => isFootballReport({
      headline: row.headline,
      summary: row.clean_text,
      sourceName: row.source_name,
      url: row.canonical_url,
    }));
    const reporters = new Map<string, { value: string; count: number; weight: number; lastSeen: string | null }>();
    const outlets = new Map<string, { value: string; count: number; weight: number; lastSeen: string | null }>();

    for (const row of footballReports) {
      const reporter = row.reporter?.trim() ?? "";
      if (reporter.length >= 2) {
        const key = reporter.toLocaleLowerCase("en-US");
        const current = reporters.get(key) ?? { value: reporter, count: 0, weight: 0, lastSeen: row.last_seen };
        current.count += 1;
        current.weight += Number(row.reliability_weight) || 50;
        current.lastSeen = !current.lastSeen || (row.last_seen && row.last_seen > current.lastSeen) ? row.last_seen : current.lastSeen;
        reporters.set(key, current);
      }
      const outlet = row.source_name.trim();
      const outletKey = outlet.toLocaleLowerCase("en-US");
      const currentOutlet = outlets.get(outletKey) ?? { value: outlet, count: 0, weight: 0, lastSeen: row.last_seen };
      currentOutlet.count += 1;
      currentOutlet.weight += Number(row.reliability_weight) || 50;
      currentOutlet.lastSeen = !currentOutlet.lastSeen || (row.last_seen && row.last_seen > currentOutlet.lastSeen) ? row.last_seen : currentOutlet.lastSeen;
      outlets.set(outletKey, currentOutlet);
    }

    const ranked = (kind: "reporter" | "outlet", rows: Map<string, { value: string; count: number; weight: number; lastSeen: string | null }>) =>
      [...rows.values()]
        .filter((row) => !favorites.has(`${kind}:${row.value.toLocaleLowerCase("en-US")}`))
        .map((row) => ({
          value: row.value,
          article_count: row.count,
          reliability_weight: Math.round(row.weight / row.count),
          last_seen: row.lastSeen,
        }))
        .sort((a, b) => b.article_count - a.article_count || b.reliability_weight - a.reliability_weight || String(b.last_seen).localeCompare(String(a.last_seen)))
        .slice(0, 5)
        .map((row) => mapSuggestion(kind, row));

    return apiJson({
      day: dayInBangkok(),
      scope: "football_only",
      suggestions: {
        reporters: ranked("reporter", reporters),
        outlets: ranked("outlet", outlets),
      },
    });
  } catch (error) {
    return databaseError(error);
  }
}

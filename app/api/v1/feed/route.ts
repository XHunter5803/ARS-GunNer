import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { feedItems, sources } from "../../../../db/schema";
import { apiJson, databaseError } from "../../../../lib/api-response";

function categoryFor(headline: string): "Transfer" | "Club" | "League" {
  if (/transfer|sign(?:ing|ed)?|loan|bid|move|ย้าย|เซ็น|ยืม|ข้อเสนอ|ตลาดซื้อขาย/i.test(headline)) return "Transfer";
  if (/league|premier|uefa|fifa|championship|cup|ลีก|พรีเมียร์ลีก|ยูฟ่า|ฟุตบอลโลก|ถ้วย/i.test(headline)) return "League";
  return "Club";
}

export async function GET(request: Request) {
  try {
    const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 60);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 60;
    const db = await getDb();
    const rows = await db
      .select({
        id: feedItems.id,
        headline: feedItems.headline,
        summary: feedItems.cleanText,
        reporter: feedItems.reporter,
        language: feedItems.language,
        publishedAt: feedItems.publishedAt,
        createdAt: feedItems.createdAt,
        url: feedItems.canonicalUrl,
        sourceName: sources.name,
        sourceType: sources.sourceType,
        reliabilityWeight: sources.reliabilityWeight,
      })
      .from(feedItems)
      .leftJoin(sources, eq(feedItems.sourceId, sources.id))
      .orderBy(desc(feedItems.publishedAt), desc(feedItems.createdAt))
      .limit(limit);

    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(feedItems);
    return apiJson({
      reports: rows.map((row) => ({
        id: row.id,
        category: categoryFor(row.headline),
        headline: row.headline,
        summary: row.summary.slice(0, 600),
        reporter: row.reporter,
        language: row.language,
        published_at: row.publishedAt,
        imported_at: row.createdAt,
        url: row.url,
        source_name: row.sourceName || "Unknown source",
        source_type: row.sourceType || "outlet",
        reliability_weight: row.reliabilityWeight ?? 50,
      })),
      total: Number(countRow?.count ?? rows.length),
    });
  } catch (error) {
    return databaseError(error);
  }
}

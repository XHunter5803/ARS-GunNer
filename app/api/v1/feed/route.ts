import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { feedItems, sources } from "../../../../db/schema";
import { apiJson, databaseError } from "../../../../lib/api-response";
import { isFootballReport } from "../../../../lib/football-filter";

function categoryFor(headline: string): "Transfer" | "Club" | "League" {
  if (/transfer|sign(?:ing|ed)?|loan|bid|move|ย้าย|เซ็น|ยืม|ข้อเสนอ|ตลาดซื้อขาย/i.test(headline)) return "Transfer";
  if (/league|premier|uefa|fifa|championship|cup|ลีก|พรีเมียร์ลีก|ยูฟ่า|ฟุตบอลโลก|ถ้วย/i.test(headline)) return "League";
  return "Club";
}

function imageUrlFromRaw(rawText: string) {
  const marker = rawText.match(/<!--ARS_IMAGE:(https:\/\/[^\s>]+)-->/i)?.[1];
  const html = rawText.match(/<img\b[^>]*\bsrc=["'](https:\/\/[^"']+)["']/i)?.[1];
  const value = marker || html || "";
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
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
        rawText: feedItems.rawText,
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
      .limit(300);

    const footballRows = rows
      .filter((row) => isFootballReport({
        headline: row.headline,
        summary: row.summary,
        sourceName: row.sourceName,
        url: row.url,
      }))
      .slice(0, limit);
    return apiJson({
      scope: "football_only",
      reports: footballRows.map((row) => ({
        id: row.id,
        category: categoryFor(row.headline),
        headline: row.headline,
        summary: row.summary.slice(0, 600),
        image_url: imageUrlFromRaw(row.rawText),
        reporter: row.reporter,
        language: row.language,
        published_at: row.publishedAt,
        imported_at: row.createdAt,
        url: row.url,
        source_name: row.sourceName || "Unknown source",
        source_type: row.sourceType || "outlet",
        reliability_weight: row.reliabilityWeight ?? 50,
      })),
      total: footballRows.length,
    });
  } catch (error) {
    return databaseError(error);
  }
}

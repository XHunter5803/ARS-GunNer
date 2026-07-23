import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sources } from "../../../../db/schema";
import { apiError, apiJson, databaseError, readJson } from "../../../../lib/api-response";
import { runRssIngestion } from "../../../../lib/rss-ingestion";
import { isSafePublicHttpsUrl } from "../../../../lib/security";

const sourceTypes = new Set(["official", "original", "reporter", "outlet"]);
const statuses = new Set(["active", "paused"]);

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(sources).orderBy(desc(sources.updatedAt));
    return apiJson({ sources: rows });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJson<{
      name?: string;
      homepage_url?: string;
      feed_url?: string;
      source_type?: string;
      reliability_weight?: number;
    }>(request);
    const name = payload.name?.trim() ?? "";
    const homepageUrl = payload.homepage_url?.trim() ?? "";
    const feedUrl = payload.feed_url?.trim() ?? "";
    const sourceType = payload.source_type?.trim() ?? "outlet";
    const reliabilityWeight = payload.reliability_weight ?? 50;

    if (name.length < 2 || name.length > 160) return apiError(400, "VALIDATION_ERROR", "name ต้องยาว 2–160 ตัวอักษร");
    if (!isSafePublicHttpsUrl(homepageUrl) || !isSafePublicHttpsUrl(feedUrl)) {
      return apiError(400, "UNSAFE_URL", "รองรับเฉพาะ HTTPS URL สาธารณะและห้ามใช้ Private network");
    }
    if (!sourceTypes.has(sourceType)) return apiError(400, "VALIDATION_ERROR", "source_type ไม่ถูกต้อง");
    if (!Number.isInteger(reliabilityWeight) || reliabilityWeight < 0 || reliabilityWeight > 100) {
      return apiError(400, "VALIDATION_ERROR", "reliability_weight ต้องอยู่ระหว่าง 0–100");
    }

    const db = await getDb();
    const [source] = await db
      .insert(sources)
      .values({
        name,
        homepageUrl,
        feedUrl,
        sourceType: sourceType as "official" | "original" | "reporter" | "outlet",
        reliabilityWeight,
      })
      .returning();
    const { env } = await import("cloudflare:workers") as unknown as { env: { DB?: D1Database } };
    const ingestion = env.DB
      ? await runRssIngestion(env.DB, { sourceId: source.id })
      : { sources_checked: 0, sources_succeeded: 0, sources_failed: 1, items_seen: 0, items_inserted: 0, errors: [{ source_id: source.id, message: "DATABASE_UNAVAILABLE" }] };
    const [updatedSource] = await db.select().from(sources).where(eq(sources.id, source.id)).limit(1);
    return apiJson({ source: updatedSource ?? source, ingestion }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PAYLOAD_TOO_LARGE") return apiError(413, "PAYLOAD_TOO_LARGE", "ข้อมูลมีขนาดใหญ่เกินกำหนด");
    if (/unique/i.test(message)) return apiError(409, "DUPLICATE_SOURCE", "RSS Feed นี้มีอยู่แล้ว");
    if (/JSON/i.test(message)) return apiError(400, "INVALID_JSON", "รูปแบบ JSON ไม่ถูกต้อง");
    return databaseError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await readJson<{ id?: number; status?: string; action?: string }>(request);
    if (payload.action === "sync") {
      if (!Number.isInteger(payload.id) || Number(payload.id) < 1) {
        return apiError(400, "VALIDATION_ERROR", "ต้องระบุ id ของแหล่งข่าวที่ต้องการ Sync");
      }
      const { env } = await import("cloudflare:workers") as unknown as { env: { DB?: D1Database } };
      if (!env.DB) return apiError(503, "DATABASE_UNAVAILABLE", "ไม่พบ D1 binding DB");
      const ingestion = await runRssIngestion(env.DB, { sourceId: Number(payload.id) });
      const db = await getDb();
      const [source] = await db.select().from(sources).where(eq(sources.id, Number(payload.id))).limit(1);
      if (!source) return apiError(404, "NOT_FOUND", "ไม่พบแหล่งข่าว");
      return apiJson({ source, ingestion });
    }
    if (!Number.isInteger(payload.id) || !payload.status || !statuses.has(payload.status)) {
      return apiError(400, "VALIDATION_ERROR", "ต้องระบุ id และ status เป็น active หรือ paused");
    }
    const db = await getDb();
    const [source] = await db
      .update(sources)
      .set({ status: payload.status as "active" | "paused", updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(sources.id, payload.id as number))
      .returning();
    if (!source) return apiError(404, "NOT_FOUND", "ไม่พบแหล่งข่าว");
    return apiJson({ source });
  } catch (error) {
    return databaseError(error);
  }
}

import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { articleRevisions, articles, deliveryAttempts, publicationJobs } from "../../../../../db/schema";
import { apiError, apiJson, databaseError, readJson } from "../../../../../lib/api-response";
import type { PerspectiveArticle } from "../../../../../lib/news-pipeline";
import { createSocialPreviews } from "../../../../../lib/social-publishing";
import type { SocialChannel } from "../../../../../lib/social-publishing";

const allowedChannels = new Set<SocialChannel>(["telegram"]);

export async function GET() {
  try {
    const db = await getDb();
    const jobs = await db.select().from(publicationJobs).orderBy(desc(publicationJobs.createdAt)).limit(60);
    const attempts = await db.select().from(deliveryAttempts).orderBy(desc(deliveryAttempts.attemptedAt)).limit(100);
    return apiJson({ jobs, delivery_attempts: attempts });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJson<{ article_id?: number; channels?: SocialChannel[]; scheduled_at?: string }>(request);
    const channels = [...new Set(payload.channels ?? [])];
    if (!Number.isInteger(payload.article_id) || !channels.length || channels.length > 3 || channels.some((channel) => !allowedChannels.has(channel))) {
      return apiError(400, "VALIDATION_ERROR", "ต้องระบุ article_id และ channels ที่ถูกต้อง");
    }
    const scheduledDate = payload.scheduled_at ? new Date(payload.scheduled_at) : new Date();
    if (!Number.isFinite(scheduledDate.getTime())) return apiError(400, "VALIDATION_ERROR", "scheduled_at ไม่ถูกต้อง");
    if (scheduledDate.getTime() < Date.now() - 300_000 || scheduledDate.getTime() > Date.now() + 180 * 86_400_000) {
      return apiError(400, "VALIDATION_ERROR", "กำหนดเวลาได้ตั้งแต่ปัจจุบันถึง 180 วันข้างหน้า");
    }
    const scheduledAt = scheduledDate.toISOString();
    const db = await getDb();
    const [articleRow] = await db.select().from(articles).where(eq(articles.id, payload.article_id as number)).limit(1);
    if (!articleRow) return apiError(404, "NOT_FOUND", "ไม่พบบทความ");
    if (articleRow.status !== "approved" || articleRow.readinessScore < 85) return apiError(422, "ARTICLE_NOT_APPROVED", "จัดคิวได้เฉพาะบทความที่ Approved และ Readiness ≥ 85");
    const [revision] = await db.select().from(articleRevisions).where(eq(articleRevisions.articleId, articleRow.id)).orderBy(desc(articleRevisions.revisionNo)).limit(1);
    if (!revision) return apiError(404, "REVISION_NOT_FOUND", "ไม่พบ Revision ของบทความ");
    const article = JSON.parse(revision.payloadJson) as PerspectiveArticle;
    const previews = createSocialPreviews(article);
    const approvedBy = request.headers.get("oai-authenticated-user-email")?.slice(0, 200) || "editor";
    const created = [];
    for (const channel of channels) {
      const preview = previews.find((item) => item.channel === channel);
      if (!preview) continue;
      const dedupeKey = `${articleRow.id}:${revision.revisionNo}:${channel}:${scheduledAt}`;
      const [job] = await db.insert(publicationJobs).values({ articleId: articleRow.id, channel, dedupeKey, scheduledAt, previewText: preview.text, payloadJson: JSON.stringify(preview), approvedBy }).onConflictDoNothing({ target: publicationJobs.dedupeKey }).returning();
      if (job) created.push(job);
    }
    if (!created.length) return apiError(409, "DUPLICATE_JOBS", "รายการนี้อยู่ในคิวแล้ว");
    await db.update(articles).set({ status: "scheduled", updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(articles.id, articleRow.id));
    return apiJson({ jobs: created, previews }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return apiError(500, "REVISION_INVALID", "Revision JSON ไม่ถูกต้อง");
    return databaseError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await readJson<{ id?: number; action?: string }>(request);
    if (!Number.isInteger(payload.id) || payload.action !== "cancel") return apiError(400, "VALIDATION_ERROR", "รองรับ action cancel เท่านั้น");
    const db = await getDb();
    const [job] = await db.update(publicationJobs).set({ status: "cancelled", updatedAt: sql`CURRENT_TIMESTAMP` }).where(sql`${publicationJobs.id} = ${payload.id as number} AND ${publicationJobs.status} = 'queued'`).returning();
    if (!job) return apiError(409, "JOB_NOT_CANCELLABLE", "ยกเลิกได้เฉพาะงานที่ยังอยู่ในคิว");
    return apiJson({ job });
  } catch (error) {
    return databaseError(error);
  }
}

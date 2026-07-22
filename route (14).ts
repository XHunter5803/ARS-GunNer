import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articleRevisions, articles, auditEvents } from "../../../../db/schema";
import { apiError, apiJson, databaseError, readJson } from "../../../../lib/api-response";
import { validatePerspectiveArticle } from "../../../../lib/news-pipeline";
import type { PerspectiveArticle } from "../../../../lib/news-pipeline";

const transitions: Record<string, string[]> = {
  draft: ["review"],
  review: ["draft", "approved", "rejected"],
  rejected: ["draft"],
  approved: ["scheduled"],
  scheduled: ["published", "approved"],
  published: [],
};

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select().from(articles).orderBy(desc(articles.updatedAt)).limit(50);
    return apiJson({ articles: rows });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  let createdId: number | null = null;
  try {
    const payload = await readJson<{ article?: PerspectiveArticle; article_id?: number }>(request, 180_000);
    if (!payload.article) return apiError(400, "VALIDATION_ERROR", "article ห้ามว่าง");
    const validation = validatePerspectiveArticle(payload.article);
    if (!validation.valid || validation.readiness_score < 70) {
      return apiError(422, "ARTICLE_NOT_READY", "บทความยังไม่ผ่านเกณฑ์บันทึก", validation.readiness_notes);
    }
    const db = await getDb();

    if (payload.article_id) {
      const [existing] = await db.select().from(articles).where(eq(articles.id, payload.article_id)).limit(1);
      if (!existing) return apiError(404, "NOT_FOUND", "ไม่พบบทความ");
      if (["approved", "scheduled", "published"].includes(existing.status)) return apiError(409, "ARTICLE_LOCKED", "บทความที่อนุมัติหรือเผยแพร่แล้วต้องสร้างฉบับใหม่");
      const revision = await db.select({ max: sql<number>`max(${articleRevisions.revisionNo})` }).from(articleRevisions).where(eq(articleRevisions.articleId, existing.id));
      const revisionNo = Number(revision[0]?.max ?? 0) + 1;
      await db.insert(articleRevisions).values({ articleId: existing.id, revisionNo, payloadJson: JSON.stringify(payload.article) });
      await db.update(articles).set({ headline: payload.article.headline, readinessScore: validation.readiness_score, status: "draft", updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(articles.id, existing.id));
      await db.insert(auditEvents).values({ actor: "editor", action: "article.revision", entityType: "article", entityId: String(existing.id), detailJson: JSON.stringify({ revisionNo, readinessScore: validation.readiness_score }) });
      return apiJson({ article_id: existing.id, revision_no: revisionNo, validation });
    }

    const [created] = await db.insert(articles).values({ language: payload.article.language, category: payload.article.category, headline: payload.article.headline, readinessScore: validation.readiness_score }).returning();
    createdId = created.id;
    await db.insert(articleRevisions).values({ articleId: created.id, revisionNo: 1, payloadJson: JSON.stringify(payload.article) });
    await db.insert(auditEvents).values({ actor: "editor", action: "article.create", entityType: "article", entityId: String(created.id), detailJson: JSON.stringify({ readinessScore: validation.readiness_score }) });
    return apiJson({ article: created, revision_no: 1, validation }, { status: 201 });
  } catch (error) {
    if (createdId) {
      try {
        const db = await getDb();
        await db.delete(articles).where(eq(articles.id, createdId));
      } catch {
        // The original error remains the response source.
      }
    }
    return databaseError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await readJson<{ id?: number; status?: string }>(request);
    if (!Number.isInteger(payload.id) || !payload.status) return apiError(400, "VALIDATION_ERROR", "ต้องระบุ id และ status");
    const db = await getDb();
    const [existing] = await db.select().from(articles).where(eq(articles.id, payload.id as number)).limit(1);
    if (!existing) return apiError(404, "NOT_FOUND", "ไม่พบบทความ");
    if (!(transitions[existing.status] ?? []).includes(payload.status)) return apiError(409, "INVALID_TRANSITION", `เปลี่ยนสถานะจาก ${existing.status} เป็น ${payload.status} ไม่ได้`);
    if (payload.status === "approved" && existing.readinessScore < 85) return apiError(422, "READINESS_TOO_LOW", "อนุมัติได้เมื่อ Readiness Score อย่างน้อย 85");
    const [updated] = await db.update(articles).set({ status: payload.status as typeof existing.status, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(articles.id, existing.id)).returning();
    await db.insert(auditEvents).values({ actor: "approver", action: `article.${payload.status}`, entityType: "article", entityId: String(existing.id), detailJson: JSON.stringify({ from: existing.status, to: payload.status }) });
    return apiJson({ article: updated });
  } catch (error) {
    return databaseError(error);
  }
}

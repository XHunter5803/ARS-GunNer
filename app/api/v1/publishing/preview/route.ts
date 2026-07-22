import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { articleRevisions, articles } from "../../../../../db/schema";
import { apiError, apiJson, databaseError, readJson } from "../../../../../lib/api-response";
import { validatePerspectiveArticle } from "../../../../../lib/news-pipeline";
import type { PerspectiveArticle } from "../../../../../lib/news-pipeline";
import { createSocialPreviews } from "../../../../../lib/social-publishing";

export async function POST(request: Request) {
  try {
    const payload = await readJson<{ article_id?: number; article?: PerspectiveArticle }>(request, 180_000);
    let article = payload.article;
    let articleStatus = "unsaved";
    let articleId: number | null = null;

    if (payload.article_id) {
      const db = await getDb();
      const [row] = await db.select().from(articles).where(eq(articles.id, payload.article_id)).limit(1);
      if (!row) return apiError(404, "NOT_FOUND", "ไม่พบบทความ");
      const [revision] = await db.select().from(articleRevisions).where(eq(articleRevisions.articleId, row.id)).orderBy(desc(articleRevisions.revisionNo)).limit(1);
      if (!revision) return apiError(404, "REVISION_NOT_FOUND", "ไม่พบ Revision ของบทความ");
      article = JSON.parse(revision.payloadJson) as PerspectiveArticle;
      articleStatus = row.status;
      articleId = row.id;
    }
    if (!article) return apiError(400, "VALIDATION_ERROR", "ต้องระบุ article_id หรือ article");
    const validation = validatePerspectiveArticle(article);
    if (!validation.valid) return apiError(422, "ARTICLE_INVALID", "บทความไม่ผ่านกฎ Preview", validation.errors);
    return apiJson({ article_id: articleId, article_status: articleStatus, readiness_score: validation.readiness_score, previews: createSocialPreviews(article) });
  } catch (error) {
    if (error instanceof SyntaxError) return apiError(500, "REVISION_INVALID", "Revision JSON ไม่ถูกต้อง");
    return databaseError(error);
  }
}

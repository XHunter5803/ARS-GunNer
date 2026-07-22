import { apiError, apiJson, readJson } from "../../../../../lib/api-response";
import { validatePerspectiveArticle } from "../../../../../lib/news-pipeline";
import type { PerspectiveArticle } from "../../../../../lib/news-pipeline";

export async function POST(request: Request) {
  try {
    const payload = await readJson<{ article?: PerspectiveArticle }>(request, 180_000);
    if (!payload.article || typeof payload.article !== "object") {
      return apiError(400, "VALIDATION_ERROR", "article ห้ามว่าง");
    }
    return apiJson(validatePerspectiveArticle(payload.article));
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return apiError(413, "PAYLOAD_TOO_LARGE", "บทความมีขนาดใหญ่เกินกำหนด");
    }
    return apiError(400, "INVALID_JSON", "รูปแบบ JSON ไม่ถูกต้อง");
  }
}

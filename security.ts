import { analyzeSources, isNewsSourceInput } from "../../../../../lib/news-pipeline";
import { apiError, apiJson, readJson } from "../../../../../lib/api-response";

export async function POST(request: Request) {
  try {
    const payload = await readJson<{ sources?: unknown[] }>(request, 700_000);
    if (!Array.isArray(payload.sources) || payload.sources.length === 0) {
      return apiError(400, "VALIDATION_ERROR", "sources ต้องมีอย่างน้อย 1 แหล่ง");
    }
    if (payload.sources.length > 30) {
      return apiError(400, "VALIDATION_ERROR", "วิเคราะห์ได้สูงสุด 30 แหล่งต่อครั้ง");
    }
    if (!payload.sources.every(isNewsSourceInput)) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "แต่ละแหล่งต้องมี source_name, url, headline และ article_text",
      );
    }
    return apiJson(analyzeSources(payload.sources));
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      return apiError(413, "PAYLOAD_TOO_LARGE", "ข้อมูลข่าวมีขนาดใหญ่เกินกำหนด");
    }
    return apiError(400, "INVALID_JSON", "รูปแบบ JSON ไม่ถูกต้อง");
  }
}

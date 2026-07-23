import { apiError, apiJson, readJson } from "../../../../../lib/api-response";
import { buildGroundedFallbackArticle, generatePerspectiveArticle } from "../../../../../lib/article-generation";
import { isNewsSourceInput } from "../../../../../lib/news-pipeline";
import type { GeneratePerspectiveInput } from "../../../../../lib/article-generation";

type RuntimeBindings = {
  AI?: { run(model: string, input: Record<string, unknown>): Promise<unknown> };
  WORKERS_AI_MODEL?: string;
  WORKERS_AI_RESEARCH_MODEL?: string;
};

function isDraftShapeError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.includes("AI_JSON") || message.startsWith("AI_DRAFT_INCOMPLETE:");
}

export async function POST(request: Request) {
  try {
    const input = await readJson<GeneratePerspectiveInput>(request, 500_000);
    if (!(["th", "en", "bilingual"] as string[]).includes(input.language)) return apiError(400, "VALIDATION_ERROR", "language ไม่ถูกต้อง");
    if (!input.category?.trim() || !input.signature?.trim()) return apiError(400, "VALIDATION_ERROR", "category และ signature ห้ามว่าง");
    if (!Array.isArray(input.brand_hashtags) || input.brand_hashtags.length < 3 || input.brand_hashtags.length > 8) return apiError(400, "VALIDATION_ERROR", "brand_hashtags ต้องมี 3–8 รายการ");
    if (!Array.isArray(input.sources) || input.sources.length < 1 || input.sources.length > 12 || !input.sources.every(isNewsSourceInput)) return apiError(400, "VALIDATION_ERROR", "sources ต้องมีข้อมูลที่ถูกต้อง 1–12 แหล่ง");

    const { env } = await import("cloudflare:workers") as unknown as { env: RuntimeBindings };
    if (!env.AI) return apiError(503, "AI_BINDING_UNAVAILABLE", "ยังไม่ได้ผูก Workers AI binding ชื่อ AI");
    const model = env.WORKERS_AI_MODEL || "@cf/zai-org/glm-4.7-flash";
    const fallbackModel = env.WORKERS_AI_RESEARCH_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast";
    let result;
    try {
      result = await generatePerspectiveArticle(env.AI, model, input);
    } catch (error) {
      if (!isDraftShapeError(error)) throw error;
      if (model === fallbackModel) {
        result = buildGroundedFallbackArticle(input, error instanceof Error ? error.message : "AI_DRAFT_INVALID");
      } else {
        try {
          result = await generatePerspectiveArticle(env.AI, fallbackModel, input);
        } catch (fallbackError) {
          if (!isDraftShapeError(fallbackError)) throw fallbackError;
          result = buildGroundedFallbackArticle(input, fallbackError instanceof Error ? fallbackError.message : "AI_DRAFT_INVALID");
        }
      }
    }
    if (!result.validation.valid) {
      return apiError(422, "ARTICLE_NOT_READY", "AI draft ไม่ผ่านกฎก่อนเผยแพร่", result.validation.readiness_notes);
    }
    return apiJson(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PAYLOAD_TOO_LARGE") return apiError(413, "PAYLOAD_TOO_LARGE", "ข้อมูลมีขนาดใหญ่เกินกำหนด");
    if (message.includes("JSON")) return apiError(502, "AI_INVALID_JSON", "Workers AI ไม่ได้ส่ง JSON ที่ถูกต้อง");
    return apiError(500, "AI_GENERATION_FAILED", "ไม่สามารถสร้างบทความได้ กรุณาตรวจ AI binding และข้อมูลต้นทาง");
  }
}
